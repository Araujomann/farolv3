import { useFocusEffect } from "expo-router";
import { useCallback } from "react";
import { StyleSheet, View, type LayoutChangeEvent } from "react-native";
import Reanimated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withTiming,
} from "react-native-reanimated";

import { Text } from "@/components/ui/text";
import {
    TitleColorIcon,
    TitleColorText,
    useTitleBackgroundStyle,
    useTitleBorderStyle,
} from "@/src/features/profile/components/TitleColor";
import type { GamificationLevel } from "@/src/features/profile/constants/levels";
import { useTranslation } from "@/src/i18n";
import { useAppTheme } from "@/src/theme/useAppTheme";

type ProgressCardProps = {
    level: GamificationLevel;
    nextLevel: GamificationLevel | undefined;
    progressPercent: number;
};

const PROGRESS_ANIMATION_DELAY_MS = 250;
const PROGRESS_ANIMATION_DURATION_MS = 900;

const progressStyles = StyleSheet.create({
    track: {
        marginTop: 20,
        height: 10,
        borderRadius: 999,
        overflow: "hidden",
    },
    bar: {
        ...StyleSheet.absoluteFillObject,
        borderRadius: 999,
    },
});

export function ProgressCard({
    level,
    nextLevel,
    progressPercent,
}: ProgressCardProps) {
    const { t } = useTranslation();
    const { colors } = useAppTheme();
    const LevelIcon = level.icon;
    const borderStyle = useTitleBorderStyle();
    const barColorStyle = useTitleBackgroundStyle();

    // A barra tem sempre a largura total da trilha e só desliza com
    // `translateX`: transform roda inteiro na thread de UI, sem recalcular
    // layout a cada frame (animar `width` recalcula).
    const progress = useSharedValue(0); // 0 → 1
    const trackWidth = useSharedValue(0);
    const barTransformStyle = useAnimatedStyle(() => {
        const width = trackWidth.value;
        return {
            // Escondida até a trilha ser medida, para não "piscar" cheia.
            opacity: width > 0 ? 1 : 0,
            transform: [{ translateX: (progress.value - 1) * width }],
        };
    });

    const handleTrackLayout = useCallback(
        (event: LayoutChangeEvent) => {
            trackWidth.value = event.nativeEvent.layout.width;
        },
        [trackWidth],
    );

    // Sempre que a aba ganha foco (ou o progresso muda), a barra parte do
    // zero e avança até o valor atual. O pequeno atraso deixa a transição
    // de tela terminar antes, para a animação não disputar frames com ela.
    useFocusEffect(
        useCallback(() => {
            progress.value = 0;
            progress.value = withDelay(
                PROGRESS_ANIMATION_DELAY_MS,
                withTiming(Math.min(1, Math.max(0, progressPercent / 100)), {
                    duration: PROGRESS_ANIMATION_DURATION_MS,
                    easing: Easing.out(Easing.cubic),
                }),
            );
        }, [progress, progressPercent]),
    );

    return (
        <Reanimated.View
            className="relative mt-4 overflow-hidden rounded-xl border p-6"
            style={[{ backgroundColor: colors.surface }, borderStyle]}
        >
            {/* Decorative watermark icon */}
            <View
                className="absolute opacity-10"
                style={{ right: -8, top: -8 }}
            >
                <TitleColorIcon icon={LevelIcon} size={100} strokeWidth={1} />
            </View>

            {/* Content */}
            <View className="z-10">
                <Text
                    className="text-base font-body-semibold"
                    style={{ color: colors.onSurface }}
                >
                    {nextLevel
                        ? t("profile.progress", {
                              from: t(`profile.levels.${level.key}.label`),
                              to: t(`profile.levels.${nextLevel.key}.label`),
                          })
                        : t("profile.maxLevel")}
                </Text>

                <Text
                    className="font-body mt-2 text-[13px] leading-5"
                    style={{ color: colors.onSurfaceVariant }}
                >
                    {t(`profile.levels.${level.key}.message`)}
                </Text>

                {/* Progress Bar */}
                <View
                    onLayout={handleTrackLayout}
                    style={[
                        progressStyles.track,
                        { backgroundColor: colors.surfaceStrong },
                    ]}
                >
                    {/* Sem className nas views animadas: estilos de classe
                        podem sobrescrever o estilo animado. */}
                    <Reanimated.View
                        style={[
                            progressStyles.bar,
                            barColorStyle,
                            barTransformStyle,
                        ]}
                    />
                </View>
                <TitleColorText className="mt-2 text-right text-xs font-body-semibold">
                    {`${Math.round(progressPercent)}%`}
                </TitleColorText>
            </View>
        </Reanimated.View>
    );
}
