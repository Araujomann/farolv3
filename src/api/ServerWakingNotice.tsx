import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "@/src/i18n";
import { useAppTheme } from "@/src/theme/useAppTheme";
import { useIsServerSlow } from "./serverStatus";

/**
 * Faixa exibida no topo enquanto alguma requisição demora: em geral é a API
 * acordando da hibernação do plano gratuito do Render (~1 min).
 */
export function ServerWakingNotice() {
    const isServerSlow = useIsServerSlow();
    const insets = useSafeAreaInsets();
    const { colors } = useAppTheme();
    const { t } = useTranslation();

    if (!isServerSlow) return null;

    return (
        <View
            accessibilityLiveRegion="polite"
            accessibilityRole="alert"
            pointerEvents="none"
            style={{
                position: "absolute",
                top: insets.top + 8,
                left: 16,
                right: 16,
                paddingVertical: 10,
                paddingHorizontal: 14,
                borderRadius: 12,
                backgroundColor: colors.primaryContainer,
            }}
        >
            <Text
                style={{
                    color: colors.onPrimaryContainer,
                    fontSize: 13,
                    textAlign: "center",
                }}
            >
                {t("common.serverWaking")}
            </Text>
        </View>
    );
}
