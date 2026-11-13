import { SearchBar } from "@/components";
import { AccidentMarker, MapFilters, useAccidents } from "@/src/features/map";
import type { MapPlaceSearchResult } from "@/src/features/map/services/placeSearch";
import Mapbox from "@rnmapbox/maps";
import { useFocusEffect, useRouter } from "expo-router";
import * as Notifications from "expo-notifications";
import { Image } from "expo-image";
import { CalendarDays, ChevronDown, X } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    ActivityIndicator,
    Keyboard,
    Pressable,
    Text,
    View,
} from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { ACCIDENT_APPROVED_EVENT } from "@/src/features/notifications/pushNotifications";
import prfLogo from "../../../policia-rodoviaria-federal-logo-png_seeklogo-351022.png";

const mapStyle = {
    version: 8,
    imports: [
        {
            id: "basemap",
            url: "mapbox://styles/mapbox/standard",
        },
    ],
} as const;

const DEFAULT_CENTER: [number, number] = [-47.47812, -5.52693];
const SEARCH_ZOOM_LEVELS = {
    Estabelecimento: 18,
    Rua: 17,
} as const;
const CAMERA_PADDING = {
    paddingTop: 140,
    paddingRight: 48,
    paddingBottom: 120,
    paddingLeft: 48,
};
const MARKER_COLORS = {
    low: "#0969D7",
    medium: "#D99A24",
    high: "#D9534F",
    critical: "#B42318",
    unknown: "#0969D7",
} as const;

export default function MapScreen() {
    const router = useRouter();
    const {
        accidents,
        error,
        isLoading,
        retry,
        refreshSilently,
        filters,
        applyFilters,
        clearFilters,
    } = useAccidents();
    const cameraRef = useRef<Mapbox.Camera>(null);
    const hasFocusedMap = useRef(false);
    const previousLoading = useRef(isLoading);
    const [cameraAccidents, setCameraAccidents] = useState(accidents);
    const [selectedAccidentId, setSelectedAccidentId] = useState<string | null>(
        null,
    );
    const [searchedPlace, setSearchedPlace] =
        useState<MapPlaceSearchResult | null>(null);
    const searchedPlaceZoom = searchedPlace
        ? SEARCH_ZOOM_LEVELS[searchedPlace.category]
        : undefined;
    const [suggestionsHeight, setSuggestionsHeight] = useState(0);
    const [viewMode, setViewMode] = useState<"markers" | "heatmap">("markers");

    const handleSuggestionsHeightChange = useCallback((height: number) => {
        setSuggestionsHeight(height);
    }, []);

    const handleSelectPlace = useCallback((place: MapPlaceSearchResult) => {
        setSelectedAccidentId(null);
        setSearchedPlace(place);
        cameraRef.current?.setCamera({
            centerCoordinate: place.center,
            zoomLevel: SEARCH_ZOOM_LEVELS[place.category],
            animationMode: "flyTo",
            animationDuration: 1200,
        });
    }, []);

    useFocusEffect(
        useCallback(() => {
            if (hasFocusedMap.current) {
                retry();
            } else {
                hasFocusedMap.current = true;
            }
        }, [retry]),
    );

    useFocusEffect(
        useCallback(() => {
            const subscription =
                Notifications.addNotificationReceivedListener(
                    (notification) => {
                        const { type, accidentId } =
                            notification.request.content.data;
                        if (
                            type === ACCIDENT_APPROVED_EVENT &&
                            typeof accidentId === "string"
                        ) {
                            refreshSilently();
                        }
                    },
                );

            return () => subscription.remove();
        }, [refreshSilently]),
    );

    useEffect(() => {
        const finishedLoading = previousLoading.current && !isLoading;
        previousLoading.current = isLoading;

        if (finishedLoading && !error) {
            setCameraAccidents(accidents);
        }
    }, [accidents, error, isLoading]);

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
    const cameraSettings = useMemo(() => {
        const longitudes = cameraAccidents.map(
            (accident) => accident.longitude,
        );
        const latitudes = cameraAccidents.map((accident) => accident.latitude);
        const singleAccidentCenter =
            cameraAccidents.length === 1
                ? ([
                      cameraAccidents[0].longitude,
                      cameraAccidents[0].latitude,
                  ] as [number, number])
                : undefined;
        const accidentBounds =
            cameraAccidents.length > 1
                ? {
                      ne: [
                          Math.max(...longitudes),
                          Math.max(...latitudes),
                      ] as [number, number],
                      sw: [
                          Math.min(...longitudes),
                          Math.min(...latitudes),
                      ] as [number, number],
                  }
                : undefined;

        return {
            bounds: accidentBounds,
            centerCoordinate: singleAccidentCenter ?? DEFAULT_CENTER,
            zoomLevel: singleAccidentCenter ? 15 : 17,
        };
    }, [cameraAccidents]);

    return (
        <View className="flex-1">
            <SearchBar
                onSelectPlace={handleSelectPlace}
                onSuggestionsHeightChange={handleSuggestionsHeightChange}
            />
            {viewMode === "markers" && (
                <MapFilters
                    filters={filters}
                    onApply={applyFilters}
                    onClear={clearFilters}
                    onInteraction={Keyboard.dismiss}
                    topOffset={suggestionsHeight > 0 ? 92 + suggestionsHeight : 84}
                />
            )}

            <Mapbox.MapView
                style={{ flex: 1 }}
                styleJSON={JSON.stringify(mapStyle)}
                onTouchStart={Keyboard.dismiss}
            >
                <Mapbox.StyleImport
                    id="basemap"
                    existing
                    config={{
                        lightPreset: "day",
                        theme: "default",
                        font: "DIN Pro",
                        showTransitLabels: true,
                        show3dObjects: true,
                        show3dBuildings: true,
                        show3dTrees: true,
                        show3dFacades: true,
                        show3dLandmarks: true,
                    }}
                />

                <Mapbox.Camera
                    ref={cameraRef}
                    bounds={searchedPlace ? undefined : cameraSettings.bounds}
                    centerCoordinate={
                        searchedPlace?.center ?? cameraSettings.centerCoordinate
                    }
                    zoomLevel={searchedPlaceZoom ?? cameraSettings.zoomLevel}
                    pitch={35}
                    animationMode="flyTo"
                    animationDuration={2000}
                    padding={CAMERA_PADDING}
                />

                <Mapbox.ShapeSource
                    id="accidents"
                    shape={accidentGeoJson}
                >
                    {viewMode === "heatmap" ? (
                        <Mapbox.HeatmapLayer
                            id="accident-heatmap"
                            style={{
                                heatmapWeight: 1,
                                heatmapIntensity: [
                                    "interpolate",
                                    ["linear"],
                                    ["zoom"],
                                    0,
                                    0.8,
                                    14,
                                    1.4,
                                ],
                                heatmapRadius: [
                                    "interpolate",
                                    ["linear"],
                                    ["zoom"],
                                    0,
                                    12,
                                    14,
                                    32,
                                ],
                                heatmapColor: [
                                    "interpolate",
                                    ["linear"],
                                    ["heatmap-density"],
                                    0,
                                    "rgba(33, 102, 172, 0)",
                                    0.2,
                                    "#65B7FF",
                                    0.4,
                                    "#FFD166",
                                    0.7,
                                    "#FF8A80",
                                    1,
                                    "#B42318",
                                ],
                                heatmapOpacity: 0.88,
                            }}
                        />
                    ) : undefined}
                </Mapbox.ShapeSource>

                {viewMode === "markers" &&
                    accidents.map((accident) => (
                        <AccidentMarker
                            key={accident.id}
                            accident={accident}
                            selected={selectedAccidentId === accident.id}
                            onSelected={() =>
                                setSelectedAccidentId(accident.id)
                            }
                        />
                    ))}
            </Mapbox.MapView>

            <View
                className="absolute bottom-7 left-4 items-start gap-2"
                onTouchStart={Keyboard.dismiss}
            >
                <View className="flex-row rounded-full bg-white p-1 shadow-lg">
                    <Pressable
                        accessibilityLabel="Exibir marcadores de acidentes"
                        accessibilityState={{ selected: viewMode === "markers" }}
                        onPress={() => setViewMode("markers")}
                        className={`rounded-full px-3 py-2 ${
                            viewMode === "markers"
                                ? "bg-[#0969D7]"
                                : "bg-transparent"
                        }`}
                    >
                        <Text
                            className={`text-xs font-body-semibold ${
                                viewMode === "markers"
                                    ? "text-white"
                                    : "text-gray-600"
                            }`}
                        >
                            Pins
                        </Text>
                    </Pressable>
                    <Pressable
                        accessibilityLabel="Exibir mapa de calor dos acidentes"
                        accessibilityState={{ selected: viewMode === "heatmap" }}
                        onPress={() => {
                            setViewMode("heatmap");
                            setSelectedAccidentId(null);
                        }}
                        className={`rounded-full px-3 py-2 ${
                            viewMode === "heatmap"
                                ? "bg-[#0969D7]"
                                : "bg-transparent"
                        }`}
                    >
                        <Text
                            className={`text-xs font-body-semibold ${
                                viewMode === "heatmap"
                                    ? "text-white"
                                    : "text-gray-600"
                            }`}
                        >
                            Calor
                        </Text>
                    </Pressable>
                </View>

                {viewMode === "markers" &&
                    !isLoading &&
                    !error &&
                    accidents.length > 0 && (
                        <View className="rounded-2xl bg-white/95 px-3 py-2 shadow-lg">
                            <Text className="mb-1 text-xs font-body-bold uppercase tracking-wide text-gray-500">
                                Severidade
                            </Text>
                            <View className="flex-row items-center gap-3">
                                <LegendItem
                                    color={MARKER_COLORS.low}
                                    label="Baixa"
                                />
                                <LegendItem
                                    color={MARKER_COLORS.medium}
                                    label="Média"
                                />
                                <LegendItem
                                    color={MARKER_COLORS.high}
                                    label="Alta"
                                />
                                <LegendItem
                                    color={MARKER_COLORS.critical}
                                    label="Crítica"
                                />
                            </View>
                        </View>
                    )}
            </View>

            {selectedAccident && (
                <View
                    className="absolute bottom-24 left-4 right-4 overflow-hidden rounded-3xl bg-white px-4 py-4 shadow-xl"
                    onTouchStart={Keyboard.dismiss}
                >
                    {selectedAccident.source === "PRF" && (
                        <Image
                            source={prfLogo}
                            contentFit="contain"
                            accessibilityElementsHidden
                            pointerEvents="none"
                            style={{
                                position: "absolute",
                                right: 10,
                                top: 0,
                                width: 120,
                                height: 120,
                                opacity: 0.11,
                            }}
                        />
                    )}
                    <View className="relative z-10 flex-row items-start justify-between">
                        <View className="flex-1 pr-3">
                            <Text className="text-xs font-body-bold uppercase tracking-wide text-gray-500">
                                Acidente selecionado
                            </Text>
                            <View className="mt-1 flex-row items-center justify-between gap-3">
                                <Text className="flex-1 text-lg font-body-bold text-gray-900">
                                    {selectedAccident.tipo_acidente ||
                                        "Ocorrência registrada"}
                                </Text>
                            </View>
                            <Text className="font-body mt-1 text-sm text-gray-600">
                                Severidade:{" "}
                                {getSeverityLabel(selectedAccident.severity)}
                            </Text>
                            <View className="mt-2 flex-row items-center">
                                <CalendarDays size={14} color="#6B7280" />
                                <Text className="ml-1.5 text-xs font-body-medium text-gray-500">
                                    {formatAccidentDate(selectedAccident.occurred_at)}
                                </Text>
                            </View>
                        </View>
                        <Pressable
                            accessibilityLabel="Fechar detalhes do acidente"
                            onPress={() => setSelectedAccidentId(null)}
                            className="rounded-full bg-gray-100 p-2"
                        >
                            <X size={18} color="#374151" />
                        </Pressable>
                    </View>
                    <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Ver detalhes e comentários do acidente"
                        onPress={() =>
                            router.push({
                                pathname: "/map/[accidentId]",
                                params: { accidentId: selectedAccident.id },
                            })
                        }
                        className="mt-3 items-center border-t border-gray-100 pt-2"
                    >
                        <ChevronDown size={20} color="#6B7280" />
                        <Text className="text-[11px] font-body-medium text-gray-500">
                            Mais detalhes
                        </Text>
                    </Pressable>
                </View>
            )}

            {isLoading && (
                <View
                    className="absolute inset-0 items-center justify-center"
                    pointerEvents="none"
                >
                    <Animated.View
                        entering={FadeIn.duration(200)}
                        exiting={FadeOut.duration(250)}
                    >
                        <View
                            className="flex-row items-center gap-2.5 rounded-full bg-white/95 px-4 py-2.5 shadow-lg"
                            accessibilityRole="progressbar"
                            accessibilityLabel="Carregando acidentes"
                        >
                            <ActivityIndicator size="small" color="#0969D7" />
                            <Text className="text-sm font-body-medium text-gray-700">
                                Carregando acidentes...
                            </Text>
                        </View>
                    </Animated.View>
                </View>
            )}

            {error && !isLoading && (
                <View
                    className="absolute left-4 right-4 top-28 items-center rounded-2xl bg-white px-4 py-3 shadow-lg"
                    onTouchStart={Keyboard.dismiss}
                >
                    <Text className="text-center text-sm font-body-medium text-gray-700">
                        {error}
                    </Text>
                    <Pressable
                        onPress={retry}
                        className="mt-2 rounded-full bg-[#0969D7] px-4 py-2"
                    >
                        <Text className="text-sm font-body-semibold text-white">
                            Tentar novamente
                        </Text>
                    </Pressable>
                </View>
            )}

            {!isLoading && !error && accidents.length === 0 && (
                <View className="absolute left-4 right-4 top-28 items-center rounded-2xl bg-white px-4 py-3 shadow-lg">
                    <Text className="text-center text-sm font-body-medium text-gray-700">
                        Nenhum acidente registrado.
                    </Text>
                </View>
            )}
        </View>
    );
}

function formatAccidentDate(value: string) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "Data não informada";
    }

    return new Intl.DateTimeFormat("pt-BR", {
        dateStyle: "short",
        timeStyle: "short",
    }).format(date);
}

function LegendItem({ color, label }: { color: string; label: string }) {
    return (
        <View className="flex-row items-center gap-1">
            <View
                className="h-2.5 w-2.5 rounded-full border border-white"
                style={{ backgroundColor: color }}
            />
            <Text className="text-[11px] font-body-medium text-gray-700">
                {label}
            </Text>
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
