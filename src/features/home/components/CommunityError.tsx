import { Activity, RefreshCw } from "lucide-react-native";
import { Pressable, View } from "react-native";

import { Text } from "@/components/ui/text";
import { CARD_SHADOW } from "@/src/features/home/constants";
import { useHomeColors } from "@/src/features/home/hooks/useHomeColors";
import { useTranslation } from "@/src/i18n";

export function CommunityError({
    message,
    onRetry,
}: {
    message: string;
    onRetry: () => void;
}) {
    const { t } = useTranslation();
    const COLORS = useHomeColors();
    return (
        <View
            className="items-center rounded-3xl bg-white dark:bg-[#1A1D24] px-5 py-7"
            style={CARD_SHADOW}
        >
            <Activity size={25} color={COLORS.primary} />
            <Text
                className="mt-3 text-center text-base font-body-semibold"
                style={{ color: COLORS.text }}
            >
                {t("home.overviewError")}
            </Text>
            <Text
                className="font-body mt-1 text-center text-sm leading-5"
                style={{ color: COLORS.secondaryText }}
            >
                {message}
            </Text>
            <Pressable
                accessibilityRole="button"
                onPress={onRetry}
                className="mt-4 flex-row items-center rounded-xl px-4 py-2"
                style={{ backgroundColor: COLORS.surfaceIcon }}
            >
                <RefreshCw size={15} color={COLORS.primary} />
                <Text
                    className="ml-2 text-sm font-body-semibold"
                    style={{ color: COLORS.primary }}
                >
                    {t("common.retry")}
                </Text>
            </Pressable>
        </View>
    );
}
