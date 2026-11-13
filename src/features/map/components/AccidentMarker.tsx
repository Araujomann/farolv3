import Mapbox from "@rnmapbox/maps";
import { memo, useCallback } from "react";
import { View } from "react-native";
import { Accident, AccidentSeverity } from "../types/accident.types";

const SEVERITY_COLORS: Record<AccidentSeverity, string> = {
    low: "#0969D7",
    medium: "#D99A24",
    high: "#D9534F",
    critical: "#B42318",
    unknown: "#0969D7",
};

const HALO_COLORS: Record<AccidentSeverity, string> = {
    low: "#65B7FF",
    medium: "#FFD166",
    high: "#FF8A80",
    critical: "#FF6B5F",
    unknown: "#65B7FF",
};

type AccidentMarkerProps = {
    accident: Accident;
    selected?: boolean;
    onSelect?: (accidentId: string) => void;
};

/**
 * Pino de acidente.
 *
 * `PointAnnotation` é rasterizada pelo Mapbox a partir da view: cada
 * re-render ou `refresh()` gera um novo bitmap na thread JS. Por isso o
 * marcador é memoizado (só re-renderiza quando o próprio acidente ou a
 * seleção dele mudam) e o destaque de seleção é estático — antes havia uma
 * pulsação via `setInterval` a cada 30 ms, que travava o mapa e o resto do
 * app enquanto um pino estava selecionado.
 */
export const AccidentMarker = memo(function AccidentMarker({
    accident,
    selected = false,
    onSelect,
}: AccidentMarkerProps) {
    const markerColor =
        SEVERITY_COLORS[accident.severity] ?? SEVERITY_COLORS.unknown;
    const haloColor = HALO_COLORS[accident.severity] ?? HALO_COLORS.unknown;
    const handleSelected = useCallback(
        () => onSelect?.(accident.id),
        [accident.id, onSelect],
    );

    return (
        <Mapbox.PointAnnotation
            id={accident.id}
            // Remonta ao (des)selecionar para o Mapbox gerar o bitmap novo.
            key={`${accident.id}-${selected ? "selected" : "idle"}`}
            coordinate={[accident.longitude, accident.latitude]}
            anchor={{ x: 0.5, y: 1 }}
            onSelected={handleSelected}
        >
            <View
                style={{
                    width: selected ? 44 : 36,
                    height: selected ? 50 : 42,
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                {selected && (
                    <View
                        style={{
                            position: "absolute",
                            width: 42,
                            height: 42,
                            borderRadius: 21,
                            backgroundColor: haloColor,
                            opacity: 0.45,
                        }}
                    />
                )}
                <View
                    style={{
                        width: selected ? 31 : 27,
                        height: selected ? 31 : 27,
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: markerColor,
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
});
