import { View } from "react-native";
import Mapbox from "@rnmapbox/maps";
import { SearchBar } from "@/components";

export default function MapScreen() {
    // 👇 Objeto com as configurações do estilo
    const styleConfig = {
        show3dObjects: true,
        show3dBuildings: true,
        show3dTrees: true,      // 🌳 ativa árvores 3D
        show3dFacades: true,    // 🪟 ativa janelas e portas
        show3dLandmarks: true,
        theme: 'default',       // ou 'faded', 'monochrome'
        lightPreset: 'day',     // ou 'night', 'dawn', 'dusk'
    };

    return (
        <View className="flex-1">
            <SearchBar />

            <Mapbox.MapView 
                style={{ flex: 1 }} 
                styleURL={"mapbox://styles/mapbox/standard"}
                // 👇 Agora é uma string JSON
                styleJSON={JSON.stringify(styleConfig)}
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