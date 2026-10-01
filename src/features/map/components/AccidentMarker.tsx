import { View } from "react-native";
import Mapbox from "@rnmapbox/maps";
import { Accident, AccidentSeverity } from "../types/accident.types";

const SEVERITY_COLORS: Record<AccidentSeverity, string> = {
    low: "#0969D7",
    medium: "#D99A24",
    high: "#D9534F",
    critical: "#B42318",
    unknown: "#0969D7",
};

const getMarkerColor = (severity: AccidentSeverity) => SEVERITY_COLORS[severity];

type AccidentMarkerProps = {
    accident: Accident;
};

export function AccidentMarker({ accident }: AccidentMarkerProps) {
    return (
        <Mapbox.PointAnnotation
            id={accident.id}
            coordinate={[accident.longitude, accident.latitude]}
        >
            <View
                style={{
                    width: 22,
                    height: 22,
                    borderRadius: 11,
                    backgroundColor: getMarkerColor(accident.severity),
                    borderWidth: 3,
                    borderColor: "#FFFFFF",
                    shadowColor: "#000000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.3,
                    shadowRadius: 3,
                    elevation: 4,
                }}
            />
        </Mapbox.PointAnnotation>
    );
}