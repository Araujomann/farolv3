import { ActivityIndicator, Pressable, View } from "react-native";

import { Text } from "@/components/ui/text";
import { useTranslation } from "@/src/i18n";
import { useAppTheme } from "@/src/theme/useAppTheme";

export function GamificationLoading() {
    const { t } = useTranslation();
    const { colors } = useAppTheme();
    return (
        <View className="mt-5 flex-row items-center justify-center gap-2 rounded-xl bg-white dark:bg-[#1A1D24] p-4">
            <ActivityIndicator size="small" color={colors.primary} />
            <Text className="font-body text-sm" style={{ color: colors.onSurfaceVariant }}>
                {t("profile.loadingProgress")}
            </Text>
        </View>
    );
}

type GamificationErrorProps = {
    message: string;
    onRetry: () => void;
};

export function GamificationError({ message, onRetry }: GamificationErrorProps) {
    const { t } = useTranslation();
    const { colors } = useAppTheme();
    return (
        <View className="mt-4 rounded-xl border border-[#F0B7A8] dark:border-[#5C2C26] bg-[#FFF8F5] dark:bg-[#2C1715] p-4">
            <Text className="font-body text-sm" style={{ color: colors.error }}>
                {message}
            </Text>
            <Pressable
                accessibilityRole="button"
                onPress={onRetry}
                className="mt-3 self-start rounded-lg bg-white dark:bg-[#1A1D24] px-3 py-2"
            >
                <Text className="text-sm font-body-semibold" style={{ color: colors.error }}>
                    {t("common.retry")}
                </Text>
            </Pressable>
        </View>
    );
}
