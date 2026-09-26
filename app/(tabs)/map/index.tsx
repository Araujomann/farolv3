import { View } from "react-native";
import Mapbox from "@rnmapbox/maps";
import { SearchBar } from "@/components";

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

export default function MapScreen() {
    return (
        <View className="flex-1">
            <SearchBar />

            <Mapbox.MapView
                style={{ flex: 1 }}
                styleJSON={JSON.stringify(mapStyle)}
            >
                <Mapbox.Camera
                    zoomLevel={17}
                    pitch={70}
                    centerCoordinate={[-47.47812, -5.52693]}
                    animationMode="flyTo"
                    animationDuration={2000}
                />
            </Mapbox.MapView>
        </View>
    );
}