import { ActivityIndicator, Pressable, View } from "react-native";

import { Text } from "@/components/ui/text";
import { useTranslation } from "@/src/i18n";
import { useAppTheme } from "@/src/theme/useAppTheme";

/** Carregamento inicial, antes de haver detalhes para exibir. */
export function AccidentDetailsLoading() {
    const { t } = useTranslation();
    const { colors } = useAppTheme();
    return (
        <View className="flex-1 items-center justify-center px-6">
            <ActivityIndicator size="large" color={colors.primary} />
            <Text className="font-body mt-3 text-sm text-gray-600 dark:text-[#AAB0BD]">
                {t("accident.loading")}
            </Text>
        </View>
    );
}

/** Falha ao carregar, sem detalhes para exibir. */
export function AccidentDetailsError({
    message,
    onRetry,
}: {
    message: string;
    onRetry: () => void;
}) {
    const { t } = useTranslation();
    return (
        <View className="flex-1 items-center justify-center px-6">
            <Text className="font-body text-center text-sm text-gray-700 dark:text-[#AAB0BD]">
                {message}
            </Text>
            <Pressable
                onPress={onRetry}
                className="mt-4 rounded-full bg-[#0058BC] px-5 py-3"
            >
                <Text className="font-body-semibold text-white">
                    {t("common.retry")}
                </Text>
            </Pressable>
        </View>
    );
}
