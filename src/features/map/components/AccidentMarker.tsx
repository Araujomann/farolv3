import Mapbox from "@rnmapbox/maps";
import { View } from "react-native";
import { Accident, AccidentSeverity } from "../types/accident.types";

const SEVERITY_COLORS: Record<AccidentSeverity, string> = {
    low: "#0969D7",
    medium: "#D99A24",
    high: "#D9534F",
    critical: "#B42318",
    unknown: "#0969D7",
};

const getMarkerColor = (severity: AccidentSeverity) =>
    SEVERITY_COLORS[severity];

type AccidentMarkerProps = {
    accident: Accident;
    selected?: boolean;
    onSelected?: () => void;
};

export function AccidentMarker({
    accident,
    selected = false,
    onSelected,
}: AccidentMarkerProps) {
    return (
        <Mapbox.PointAnnotation
            id={accident.id}
            coordinate={[accident.longitude, accident.latitude]}
            anchor={{ x: 0.5, y: 1 }}
            selected={selected}
            onSelected={onSelected}
        >
            <View
                style={{
                    width: 36,
                    height: 42,
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <View
                    style={{
                        width: selected ? 30 : 27,
                        height: selected ? 30 : 27,
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: getMarkerColor(accident.severity),
                        borderWidth: 3,
                        borderColor: "#FFFFFF",
                        borderRadius: 18,
                        borderBottomRightRadius: 5,
                        transform: [{ rotate: "45deg" }],
                        shadowColor: "#000000",
                        shadowOffset: { width: 0, height: 3 },
                        shadowOpacity: 0.35,
                        shadowRadius: 4,
                        elevation: 5,
                    }}
                >
                    <View
                        style={{
                            width: 8,
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: "#FFFFFF",
                            transform: [{ rotate: "-45deg" }],
                        }}
                    />
                </View>
            </View>
        </Mapbox.PointAnnotation>
    );
}
