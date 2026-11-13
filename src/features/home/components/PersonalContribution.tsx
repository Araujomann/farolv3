import { ChevronRight, Users } from "lucide-react-native";
import { ActivityIndicator, Pressable, View } from "react-native";

import { Text } from "@/components/ui/text";
import type { GamificationStats } from "@/src/api/profile";
import { CARD_SHADOW } from "@/src/features/home/constants";
import { useHomeColors } from "@/src/features/home/hooks/useHomeColors";
import { formatNumber, useTranslation } from "@/src/i18n";

export function PersonalContribution({
    stats,
    isLoading,
    error,
    onRetry,
    onReportsPress,
}: {
    stats: GamificationStats | null;
    isLoading: boolean;
    error: string | null;
    onRetry: () => void;
    onReportsPress: () => void;
}) {
    const { t } = useTranslation();
    const COLORS = useHomeColors();
    return (
        <View
            className="rounded-3xl bg-white dark:bg-[#1A1D24] p-4"
            style={CARD_SHADOW}
        >
            <View className="mb-4 flex-row items-center">
                <View
                    className="mr-3 h-11 w-11 items-center justify-center rounded-full"
                    style={{ backgroundColor: COLORS.surfaceIcon }}
                >
                    <Users size={21} color={COLORS.primary} strokeWidth={2.2} />
                </View>
                <View className="flex-1">
                    <Text
                        className="text-base font-body-bold"
                        style={{ color: COLORS.text }}
                    >
                        {t("home.yourContribution")}
                    </Text>
                    <Text
                        className="font-body mt-0.5 text-xs"
                        style={{ color: COLORS.secondaryText }}
                    >
                        {t("home.yourParticipation")}
                    </Text>
                </View>
                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={t("home.viewMyReports")}
                    onPress={onReportsPress}
                    className="h-9 w-9 items-center justify-center rounded-full"
                    style={{ backgroundColor: COLORS.surfaceIcon  }}
                >
                    <ChevronRight size={19} color={COLORS.primary} />
                </Pressable>
            </View>
            {isLoading ? (
                <ActivityIndicator color={COLORS.primary} />
            ) : error ? (
                <View className="flex-row items-center justify-between">
                    <Text
                        className="font-body mr-3 flex-1 text-sm leading-5"
                        style={{ color: COLORS.secondaryText }}
                    >
                        {error}
                    </Text>
                    <Pressable
                        accessibilityRole="button"
                        onPress={onRetry}
                        className="rounded-xl px-3 py-2"
                        style={{ backgroundColor: COLORS.surfaceIcon }}
                    >
                        <Text
                            className="text-sm font-body-semibold"
                            style={{ color: COLORS.primary }}
                        >
                            {t("home.retryShort")}
                        </Text>
                    </Pressable>
                </View>
            ) : stats ? (
                <View className="flex-row">
                    <View className="flex-1">
                        <Text
                            className="text-2xl font-display"
                            style={{ color: COLORS.text }}
                        >
                            {formatNumber(stats.approved_reports_count)}
                        </Text>
                        <Text
                            className="font-body mt-0.5 text-xs"
                            style={{ color: COLORS.secondaryText }}
                        >
                            {t("home.approvedReports")}
                        </Text>
                    </View>
                    <View className="flex-1">
                        <Text
                            className="text-2xl font-display"
                            style={{ color: COLORS.text }}
                        >
                            {formatNumber(stats.received_trust_votes_count)}
                        </Text>
                        <Text
                            className="font-body mt-0.5 text-xs"
                            style={{ color: COLORS.secondaryText }}
                        >
                            {t("home.trustVotes")}
                        </Text>
                    </View>
                </View>
            ) : null}
            {!error && !isLoading && stats ? (
                <Pressable
                    accessibilityRole="button"
                    onPress={onReportsPress}
                    className="mt-4 flex-row items-center"
                >
                    <Text
                        className="text-sm font-body-semibold ml-2"
                        style={{ color: COLORS.primary }}
                    >
                        {t("home.viewMyReports")}
                    </Text>
                    <ChevronRight size={16} color={COLORS.primary} />
                </Pressable>
            ) : null}
        </View>
    );
}
