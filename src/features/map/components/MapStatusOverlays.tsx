import { ActivityIndicator, Keyboard, Pressable, Text, View } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";

import { useTranslation } from "@/src/i18n";
import { useAppTheme } from "@/src/theme/useAppTheme";

const FULL_SCREEN = {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
} as const;

/** Véu sobre o mapa enquanto os acidentes carregam. */
export function MapLoadingOverlay() {
    const { t } = useTranslation();
    const { colors } = useAppTheme();
    return (
        <Animated.View
            entering={FadeIn.duration(200)}
            exiting={FadeOut.duration(300)}
            style={FULL_SCREEN}
        >
            <View
                className="flex-1 items-center justify-center bg-slate-900/25"
                onTouchStart={Keyboard.dismiss}
            >
                <View
                    className="flex-row items-center gap-2.5 rounded-full bg-white/95 dark:bg-[#1A1D24]/95 px-4 py-2.5 shadow-lg"
                    accessibilityRole="progressbar"
                    accessibilityLabel={t("map.loadingAccidents")}
                >
                    <ActivityIndicator size="small" color={colors.accent} />
                    <Text className="text-sm font-body-medium text-gray-700 dark:text-[#AAB0BD]">
                        {t("map.loadingAccidentsEllipsis")}
                    </Text>
                </View>
            </View>
        </Animated.View>
    );
}

/** Mensagem de erro sobre o mapa, com nova tentativa. */
export function MapErrorOverlay({
    message,
    onRetry,
}: {
    message: string;
    onRetry: () => void;
}) {
    const { t } = useTranslation();
    return (
        <View
            className="absolute inset-0 items-center justify-center px-8"
            pointerEvents="box-none"
        >
            <Animated.View
                entering={FadeIn.duration(200)}
                exiting={FadeOut.duration(250)}
            >
                <View
                    className="items-center rounded-2xl bg-white/95 dark:bg-[#1A1D24]/95 px-5 py-4 shadow-lg"
                    onTouchStart={Keyboard.dismiss}
                >
                    <Text className="text-center text-sm font-body-medium text-gray-700 dark:text-[#AAB0BD]">
                        {message}
                    </Text>
                    <Pressable
                        onPress={onRetry}
                        className="mt-3 rounded-full bg-[#0969D7] px-4 py-2"
                    >
                        <Text className="text-sm font-body-semibold text-white">
                            {t("common.retry")}
                        </Text>
                    </Pressable>
                </View>
            </Animated.View>
        </View>
    );
}

/** Aviso de que não há acidentes para os filtros atuais. */
export function MapEmptyOverlay() {
    const { t } = useTranslation();
    return (
        <View
            className="absolute inset-0 items-center justify-center"
            pointerEvents="none"
        >
            <Animated.View
                entering={FadeIn.duration(200)}
                exiting={FadeOut.duration(250)}
            >
                <View className="rounded-full bg-white/95 dark:bg-[#1A1D24]/95 px-4 py-2.5 shadow-lg">
                    <Text className="text-center text-sm font-body-medium text-gray-700 dark:text-[#AAB0BD]">
                        {t("map.noAccidents")}
                    </Text>
                </View>
            </Animated.View>
        </View>
    );
}
