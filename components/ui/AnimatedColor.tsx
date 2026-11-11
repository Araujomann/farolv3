import React, {
    type ReactNode,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import {
    Animated,
    StyleSheet,
    View,
} from "react-native";
import type { LucideIcon } from "lucide-react-native";

type AnimatedColorProps = {
    color: string;
};

function useColorCrossfade(color: string) {
    const currentColor = useRef(color);
    const [previousColor, setPreviousColor] = useState<string | null>(null);
    const opacity = useRef(new Animated.Value(1)).current;

    useLayoutEffect(() => {
        if (currentColor.current === color) {
            return;
        }

        const fromColor = currentColor.current;
        currentColor.current = color;
        setPreviousColor(fromColor);
        opacity.setValue(0);

        const animation = Animated.timing(opacity, {
            toValue: 1,
            duration: 350,
            useNativeDriver: true,
        });
        animation.start(({ finished }) => {
            if (finished) {
                setPreviousColor(null);
            }
        });

        return () => animation.stop();
    }, [color, opacity]);

    return { previousColor, opacity };
}

type AnimatedColorIconProps = AnimatedColorProps & {
    icon: LucideIcon;
    size: number;
    strokeWidth: number;
};

export function AnimatedColorIcon({
    icon: Icon,
    size,
    strokeWidth,
    color,
}: AnimatedColorIconProps) {
    const AnimatedIcon = useMemo(
        () => Animated.createAnimatedComponent(Icon),
        [Icon],
    );
    const currentColor = useRef(color);
    const [colorRange, setColorRange] = useState({
        from: color,
        to: color,
    });
    const progress = useRef(new Animated.Value(1)).current;

    useLayoutEffect(() => {
        if (currentColor.current === color) {
            return;
        }

        const from = currentColor.current;
        currentColor.current = color;
        setColorRange({ from, to: color });
        progress.setValue(0);

        const animation = Animated.timing(progress, {
            toValue: 1,
            duration: 350,
            useNativeDriver: false,
        });
        animation.start();

        return () => animation.stop();
    }, [color, progress]);

    const animatedColor = progress.interpolate({
        inputRange: [0, 1],
        outputRange: [colorRange.from, colorRange.to],
    });

    return (
        <AnimatedIcon
            size={size}
            color={animatedColor}
            strokeWidth={strokeWidth}
        />
    );
}

type AnimatedColorTextProps = AnimatedColorProps & {
    renderText: (color: string) => ReactNode;
};

export function AnimatedColorText({
    color,
    renderText,
}: AnimatedColorTextProps) {
    const { previousColor, opacity } = useColorCrossfade(color);

    return (
        <View>
            {previousColor !== null && (
                <View
                    pointerEvents="none"
                    style={StyleSheet.absoluteFill}
                >
                    {renderText(previousColor)}
                </View>
            )}
            <Animated.View style={{ opacity }}>
                {renderText(color)}
            </Animated.View>
        </View>
    );
}
