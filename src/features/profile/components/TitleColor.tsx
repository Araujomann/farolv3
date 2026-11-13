import React from "react";
import Animated, {
    type SharedValue,
    useAnimatedStyle,
    useDerivedValue,
} from "react-native-reanimated";
import type { LucideIcon } from "lucide-react-native";

import { CrossfadeIcon, mixHex } from "@/components/ui/AnimatedColor";
import { Text } from "@/components/ui/text";
import {
    titleColorProgress,
    useProfileTitleColorStore,
} from "@/src/features/profile/titleColorStore";

/** Cor do título do usuário, animada na thread de UI (`#RRGGBB`). */
export function useTitleColor(): SharedValue<string> {
    const fromColor = useProfileTitleColorStore((state) => state.fromColor);
    const toColor = useProfileTitleColorStore((state) => state.toColor);

    return useDerivedValue(
        () => mixHex(fromColor, toColor, titleColorProgress.value),
        [fromColor, toColor],
    );
}

type TitleColorIconProps = {
    icon: LucideIcon;
    size: number;
    strokeWidth: number;
};

/** Ícone pintado com a cor do título, com transição suave. */
export function TitleColorIcon(props: TitleColorIconProps) {
    const fromColor = useProfileTitleColorStore((state) => state.fromColor);
    const toColor = useProfileTitleColorStore((state) => state.toColor);

    return (
        <CrossfadeIcon
            {...props}
            fromColor={fromColor}
            toColor={toColor}
            progress={titleColorProgress}
        />
    );
}

const AnimatedText = Animated.createAnimatedComponent(Text);

type TitleColorTextProps = Omit<React.ComponentProps<typeof Text>, "ref">;

/** Texto pintado com a cor do título, com transição suave. */
export function TitleColorText({ style, ...props }: TitleColorTextProps) {
    const titleColor = useTitleColor();
    const colorStyle = useAnimatedStyle(() => ({ color: titleColor.value }));

    return <AnimatedText {...props} style={[style, colorStyle]} />;
}
