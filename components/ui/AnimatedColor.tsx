import React from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
    type SharedValue,
    useAnimatedStyle,
} from "react-native-reanimated";
import type { LucideIcon } from "lucide-react-native";

/**
 * Interpola linearmente duas cores `#RRGGBB`. Roda tanto na thread JS quanto
 * na thread de UI (worklet), e devolve sempre `#RRGGBB` — o que permite
 * concatenar um canal alfa (ex.: `${cor}44`).
 */
export function mixHex(from: string, to: string, t: number): string {
    "worklet";
    const a = from.length === 7 && from[0] === "#" ? parseInt(from.slice(1), 16) : NaN;
    const b = to.length === 7 && to[0] === "#" ? parseInt(to.slice(1), 16) : NaN;
    if (Number.isNaN(a) || Number.isNaN(b)) {
        return t < 0.5 ? from : to;
    }

    const amount = t <= 0 ? 0 : t >= 1 ? 1 : t;
    const channel = (shift: number) => {
        const start = (a >> shift) & 255;
        const end = (b >> shift) & 255;
        return Math.round(start + (end - start) * amount);
    };

    return (
        "#" +
        ((1 << 24) | (channel(16) << 16) | (channel(8) << 8) | channel(0))
            .toString(16)
            .slice(1)
            .toUpperCase()
    );
}

/** Opacidade da camada de baixo: some quando a de cima está totalmente visível. */
export function useUnderLayerStyle(progress: SharedValue<number>) {
    return useAnimatedStyle(() => ({
        opacity: progress.value >= 0.999 ? 0 : 1,
    }));
}

/** Opacidade da camada de cima: acompanha o progresso. */
export function useOverLayerStyle(progress: SharedValue<number>) {
    return useAnimatedStyle(() => ({ opacity: progress.value }));
}

type CrossfadeIconProps = {
    icon: LucideIcon;
    size: number;
    strokeWidth: number;
    fromColor: string;
    toColor: string;
    progress: SharedValue<number>;
};

/**
 * Ícone que transiciona de cor com um crossfade de opacidade executado
 * inteiramente na thread de UI — sem re-render do SVG a cada frame.
 */
export function CrossfadeIcon({
    icon: Icon,
    size,
    strokeWidth,
    fromColor,
    toColor,
    progress,
}: CrossfadeIconProps) {
    const underStyle = useUnderLayerStyle(progress);
    const overStyle = useOverLayerStyle(progress);

    return (
        <View style={{ width: size, height: size }}>
            <Animated.View style={[StyleSheet.absoluteFill, underStyle]}>
                <Icon size={size} color={fromColor} strokeWidth={strokeWidth} />
            </Animated.View>
            <Animated.View style={[StyleSheet.absoluteFill, overStyle]}>
                <Icon size={size} color={toColor} strokeWidth={strokeWidth} />
            </Animated.View>
        </View>
    );
}
