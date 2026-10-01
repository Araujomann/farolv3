import { SearchBar } from "@/components";
import { useAccidents } from "@/src/features/map";
import Mapbox from "@rnmapbox/maps";
import { X } from "lucide-react-native";
import { useRef, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

const mapStyle = {
    version: 8,
    imports: [
        {
            id: "basemap",
            url: "mapbox://styles/mapbox/standard",
            config: {
                basemap: {
                    lightPreset: "night",
                    theme: "monochrome",
                    show3dObjects: false,
                    show3dBuildings: false,
                    show3dTrees: false,
                    show3dFacades: false,
                    show3dLandmarks: false,
                },
            },
        },
    ],
} as const;

const DEFAULT_CENTER: [number, number] = [-47.47812, -5.52693];
const MARKER_COLORS = {
    low: "#0969D7",
    medium: "#D99A24",
    high: "#D9534F",
    critical: "#B42318",
    unknown: "#0969D7",
} as const;

export default function MapScreen() {
    const { accidents, error, isLoading, retry } = useAccidents();
    const cameraRef = useRef<Mapbox.Camera>(null);
    const sourceRef = useRef<Mapbox.ShapeSource>(null);
    const [selectedAccidentId, setSelectedAccidentId] = useState<string | null>(
        null,
    );
    const longitudes = accidents.map((accident) => accident.longitude);
    const latitudes = accidents.map((accident) => accident.latitude);
    const selectedAccident = accidents.find(
        (accident) => accident.id === selectedAccidentId,
    );
    const accidentGeoJson: GeoJSON.FeatureCollection<GeoJSON.Point> = {
        type: "FeatureCollection",
        features: accidents.map((accident) => ({
            type: "Feature",
            id: accident.id,
            geometry: {
                type: "Point",
                coordinates: [accident.longitude, accident.latitude],
            },
            properties: {
                accidentId: accident.id,
                severity: accident.severity,
            },
        })),
    };
    const singleAccidentCenter =
        accidents.length === 1
            ? ([accidents[0].longitude, accidents[0].latitude] as [
                  number,
                  number,
              ])
            : undefined;
    const accidentBounds =
        accidents.length > 1
            ? {
                  ne: [Math.max(...longitudes), Math.max(...latitudes)] as [
                      number,
                      number,
                  ],
                  sw: [Math.min(...longitudes), Math.min(...latitudes)] as [
                      number,
                      number,
                  ],
              }
            : undefined;

    return (
        <View className="flex-1">
            <SearchBar />

            <Mapbox.MapView
                style={{ flex: 1 }}
                styleJSON={JSON.stringify(mapStyle)}
            >
                <Mapbox.Camera
                    ref={cameraRef}
                    bounds={accidentBounds}
                    centerCoordinate={singleAccidentCenter ?? DEFAULT_CENTER}
                    zoomLevel={singleAccidentCenter ? 15 : 17}
                    pitch={35}
                    animationMode="flyTo"
                    animationDuration={2000}
                    padding={{
                        paddingTop: 140,
                        paddingRight: 48,
                        paddingBottom: 120,
                        paddingLeft: 48,
                    }}
                />

                <Mapbox.ShapeSource
                    ref={sourceRef}
                    id="accidents"
                    shape={accidentGeoJson}
                    cluster
                    clusterRadius={48}
                    clusterMaxZoomLevel={14}
                    hitbox={{ width: 32, height: 32 }}
                    onPress={async (event) => {
                        const feature = event.features[0];
                        const clusterId = feature?.properties?.cluster_id;
                        const accidentId = feature?.properties?.accidentId;

                        if (clusterId !== undefined) {
                            const zoomLevel = await sourceRef.current?.getClusterExpansionZoom(
                                feature,
                            );

                            if (zoomLevel !== undefined) {
                                cameraRef.current?.setCamera({
                                    centerCoordinate: [
                                        event.coordinates.longitude,
                                        event.coordinates.latitude,
                                    ],
                                    zoomLevel,
                                    animationMode: "flyTo",
                                    animationDuration: 350,
                                });
                            }

                            return;
                        }

                        if (accidentId) setSelectedAccidentId(String(accidentId));
                    }}
                >
                    <Mapbox.CircleLayer
                        id="accident-clusters"
                        filter={["has", "point_count"]}
                        style={{
                            circleColor: "#0969D7",
                            circleRadius: 23,
                            circleOpacity: 0.94,
                            circleStrokeColor: "#FFFFFF",
                            circleStrokeWidth: 3,
                        }}
                    />
                    <Mapbox.SymbolLayer
                        id="accident-cluster-count"
                        filter={["has", "point_count"]}
                        style={{
                            textField: ["get", "point_count_abbreviated"],
                            textColor: "#FFFFFF",
                            textSize: 13,
                            textFont: ["Open Sans Bold"],
                            textAllowOverlap: true,
                        }}
                    />
                    <Mapbox.CircleLayer
                        id="accidents-low"
                        filter={[
                            "all",
                            ["!", ["has", "point_count"]],
                            ["==", ["get", "severity"], "low"],
                        ]}
                        style={{
                            circleColor: MARKER_COLORS.low,
                            circleRadius: 9,
                            circleStrokeColor: "#FFFFFF",
                            circleStrokeWidth: 3,
                        }}
                    />
                    <Mapbox.CircleLayer
                        id="accidents-medium"
                        filter={[
                            "all",
                            ["!", ["has", "point_count"]],
                            ["==", ["get", "severity"], "medium"],
                        ]}
                        style={{
                            circleColor: MARKER_COLORS.medium,
                            circleRadius: 9,
                            circleStrokeColor: "#FFFFFF",
                            circleStrokeWidth: 3,
                        }}
                    />
                    <Mapbox.CircleLayer
                        id="accidents-high"
                        filter={[
                            "all",
                            ["!", ["has", "point_count"]],
                            ["==", ["get", "severity"], "high"],
                        ]}
                        style={{
                            circleColor: MARKER_COLORS.high,
                            circleRadius: 9,
                            circleStrokeColor: "#FFFFFF",
                            circleStrokeWidth: 3,
                        }}
                    />
                    <Mapbox.CircleLayer
                        id="accidents-critical"
                        filter={[
                            "all",
                            ["!", ["has", "point_count"]],
                            ["==", ["get", "severity"], "critical"],
                        ]}
                        style={{
                            circleColor: MARKER_COLORS.critical,
                            circleRadius: 10,
                            circleStrokeColor: "#FFFFFF",
                            circleStrokeWidth: 3,
                        }}
                    />
                    <Mapbox.CircleLayer
                        id="accidents-unknown"
                        filter={[
                            "all",
                            ["!", ["has", "point_count"]],
                            ["==", ["get", "severity"], "unknown"],
                        ]}
                        style={{
                            circleColor: MARKER_COLORS.unknown,
                            circleRadius: 9,
                            circleStrokeColor: "#FFFFFF",
                            circleStrokeWidth: 3,
                        }}
                    />
                </Mapbox.ShapeSource>
            </Mapbox.MapView>

            {!isLoading && !error && accidents.length > 0 && (
                <View className="absolute bottom-24 left-4 rounded-2xl bg-white/95 px-3 py-2 shadow-lg">
                    <Text className="mb-1 text-xs font-bold uppercase tracking-wide text-gray-500">
                        Severidade
                    </Text>
                    <View className="flex-row items-center gap-3">
                        <LegendItem color={MARKER_COLORS.low} label="Baixa" />
                        <LegendItem color={MARKER_COLORS.medium} label="Média" />
                        <LegendItem color={MARKER_COLORS.high} label="Alta" />
                        <LegendItem color={MARKER_COLORS.critical} label="Crítica" />
                    </View>
                </View>
            )}

            {selectedAccident && (
                <View className="absolute bottom-24 left-4 right-4 rounded-3xl bg-white px-4 py-4 shadow-xl">
                    <View className="flex-row items-start justify-between">
                        <View className="flex-1 pr-3">
                            <Text className="text-xs font-bold uppercase tracking-wide text-gray-500">
                                Acidente selecionado
                            </Text>
                            <Text className="mt-1 text-lg font-bold text-gray-900">
                                {selectedAccident.type ?? "Ocorrência registrada"}
                            </Text>
                            <Text className="mt-1 text-sm text-gray-600">
                                Severidade: {getSeverityLabel(selectedAccident.severity)}
                            </Text>
                        </View>
                        <Pressable
                            accessibilityLabel="Fechar detalhes do acidente"
                            onPress={() => setSelectedAccidentId(null)}
                            className="rounded-full bg-gray-100 p-2"
                        >
                            <X size={18} color="#374151" />
                        </Pressable>
                    </View>
                </View>
            )}

            {isLoading && (
                <View className="absolute left-4 right-4 top-28 items-center rounded-2xl bg-white px-4 py-3 shadow-lg">
                    <ActivityIndicator color="#0969D7" />
                    <Text className="mt-1 text-sm font-medium text-gray-700">
                        Carregando acidentes...
                    </Text>
                </View>
            )}

            {error && !isLoading && (
                <View className="absolute left-4 right-4 top-28 items-center rounded-2xl bg-white px-4 py-3 shadow-lg">
                    <Text className="text-center text-sm font-medium text-gray-700">
                        {error}
                    </Text>
                    <Pressable
                        onPress={retry}
                        className="mt-2 rounded-full bg-[#0969D7] px-4 py-2"
                    >
                        <Text className="text-sm font-semibold text-white">
                            Tentar novamente
                        </Text>
                    </Pressable>
                </View>
            )}

            {!isLoading && !error && accidents.length === 0 && (
                <View className="absolute left-4 right-4 top-28 items-center rounded-2xl bg-white px-4 py-3 shadow-lg">
                    <Text className="text-center text-sm font-medium text-gray-700">
                        Nenhum acidente registrado.
                    </Text>
                </View>
            )}
        </View>
    );
}

function LegendItem({ color, label }: { color: string; label: string }) {
    return (
        <View className="flex-row items-center gap-1">
            <View
                className="h-2.5 w-2.5 rounded-full border border-white"
                style={{ backgroundColor: color }}
            />
            <Text className="text-[11px] font-medium text-gray-700">{label}</Text>
        </View>
    );
}

function getSeverityLabel(severity: keyof typeof MARKER_COLORS) {
    const labels = {
        low: "Baixa",
        medium: "Média",
        high: "Alta",
        critical: "Crítica",
        unknown: "Não informada",
    };

    return labels[severity];
}
