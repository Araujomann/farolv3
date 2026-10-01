import { ActivityIndicator, Pressable, Text, View } from "react-native";
import Mapbox from "@rnmapbox/maps";
import { SearchBar } from "@/components";
import { AccidentMarker, useAccidents } from "@/src/features/map";

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

export default function MapScreen() {
    const { accidents, error, isLoading, retry } = useAccidents();
    const longitudes = accidents.map((accident) => accident.longitude);
    const latitudes = accidents.map((accident) => accident.latitude);
    const singleAccidentCenter = accidents.length === 1
        ? [accidents[0].longitude, accidents[0].latitude] as [number, number]
        : undefined;
    const accidentBounds = accidents.length > 1
        ? {
            ne: [Math.max(...longitudes), Math.max(...latitudes)] as [number, number],
            sw: [Math.min(...longitudes), Math.min(...latitudes)] as [number, number],
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
                    bounds={accidentBounds}
                    centerCoordinate={singleAccidentCenter ?? DEFAULT_CENTER}
                    zoomLevel={singleAccidentCenter ? 15 : 17}
                    pitch={70}
                    animationMode="flyTo"
                    animationDuration={2000}
                    padding={{
                        paddingTop: 140,
                        paddingRight: 48,
                        paddingBottom: 120,
                        paddingLeft: 48,
                    }}
                />

                {accidents.map((accident) => (
                    <AccidentMarker
                        key={accident.id}
                        accident={accident}
                    />
                ))}
            </Mapbox.MapView>

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
                        <Text className="text-sm font-semibold text-white">Tentar novamente</Text>
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