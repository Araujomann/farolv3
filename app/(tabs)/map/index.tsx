import { View } from "react-native";
import Mapbox from "@rnmapbox/maps";

export default function MapScreen() {
    return (
        <View className="flex-1">

            <Mapbox.MapView 
            style={{ flex: 1 }}
            styleURL={Mapbox.StyleURL.Dark}
            >
                <Mapbox.Camera
  centerCoordinate={[-47.4917, -5.5184]}
  zoomLevel={13}
/> 
 
                
            </Mapbox.MapView>
        </View>
        

    )
}