import Mapbox from "@rnmapbox/maps";
import { useEffect, useRef, useState } from "react";
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

const PULSE_COLORS: Record<AccidentSeverity, string> = {
    low: "#65B7FF",
    medium: "#FFD166",
    high: "#FF8A80",
    critical: "#FF6B5F",
    unknown: "#65B7FF",
};

const mixColors = (from: string, to: string, amount: number) => {
    const fromRgb = from.match(/\w\w/g)?.map((value) => parseInt(value, 16));
    const toRgb = to.match(/\w\w/g)?.map((value) => parseInt(value, 16));

    if (!fromRgb || !toRgb || fromRgb.length !== 3 || toRgb.length !== 3) {
        return from;
    }

    const channels = fromRgb.map((channel, index) =>
        Math.round(channel + (toRgb[index] - channel) * amount),
    );

    return `#${channels.map((channel) => channel.toString(16).padStart(2, "0")).join("")}`;
};

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
    const annotationRef = useRef<Mapbox.PointAnnotation>(null);
    const [pulsePhase, setPulsePhase] = useState(0);
    const markerColor = getMarkerColor(accident.severity);

    useEffect(() => {
        if (!selected) {
            setPulsePhase(0);
            return;
        }

        const pulseTimer = setInterval(() => {
            setPulsePhase(
                (phase) => (phase + (Math.PI * 2 * 30) / 1200) % (Math.PI * 2),
            );
        }, 30);

        return () => clearInterval(pulseTimer);
    }, [selected]);

    useEffect(() => {
        annotationRef.current?.refresh();
    }, [pulsePhase]);

    const pulseAmount = selected ? (Math.sin(pulsePhase) + 1) / 2 : 0;
    const displayedMarkerColor = selected
        ? mixColors(
              markerColor,
              PULSE_COLORS[accident.severity],
              pulseAmount,
          )
        : markerColor;
    return (
        <Mapbox.PointAnnotation
            ref={annotationRef}
            id={accident.id}
            key={`${accident.id}-${selected ? "selected" : "idle"}`}
            coordinate={[accident.longitude, accident.latitude]}
            anchor={{ x: 0.5, y: 1 }}
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
                        width: 27,
                        height: 27,
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: displayedMarkerColor,
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
