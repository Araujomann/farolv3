import { ShieldAlert } from "lucide-react-native";
import { View } from "react-native";

import { Text } from "@/components/ui/text";
import type { AccidentOverview, AccidentSeverity } from "@/src/api/accidents";
import { CARD_SHADOW } from "@/src/features/home/constants";
import { useHomeColors } from "@/src/features/home/hooks/useHomeColors";
import { formatNumber, useTranslation } from "@/src/i18n";

export function SeverityCard({
    overview,
}: {
    overview: AccidentOverview;
}) {
    const { t } = useTranslation();
    const COLORS = useHomeColors();
    const total = overview.approved_accidents_count;
    const severities: AccidentSeverity[] = [
        "low",
        "medium",
        "high",
        "critical",
    ];

    return (
        <View
            className="rounded-3xl bg-white dark:bg-[#1A1D24] p-4"
            style={CARD_SHADOW}
        >
            <View className="mb-4 flex-row items-center">
                <ShieldAlert
                    size={21}
                    color={COLORS.primary}
                    strokeWidth={2.2}
                />
                <View className="ml-2 flex-1">
                    <Text
                        className="text-base font-body-bold"
                        style={{ color: COLORS.text }}
                    >
                        {t("home.severityTitle")}
                    </Text>
                    <Text
                        className="font-body mt-0.5 text-xs"
                        style={{ color: COLORS.secondaryText }}
                    >
                        {t("home.severitySubtitle")}
                    </Text>
                </View>
            </View>
            <View className="gap-3">
                {severities.map((severity) => {
                    const count = overview.severity_distribution[severity];
                    const percentage =
                        total > 0 ? Math.round((count / total) * 100) : 0;

                    return (
                        <View key={severity}>
                            <View className="mb-1 flex-row items-center justify-between">
                                <Text
                                    className="font-body text-sm"
                                    style={{ color: COLORS.text }}
                                >
                                    {t(`enums.severity.${severity}`)}
                                </Text>
                                <Text
                                    className="text-xs font-body-semibold"
                                    style={{ color: COLORS.secondaryText }}
                                >
                                    {formatNumber(count)} · {percentage}%
                                </Text>
                            </View>
                            <View className="h-2 overflow-hidden rounded-full bg-[#EEF0F5] dark:bg-[#242833]">
                                <View
                                    className="h-full rounded-full"
                                    style={{
                                        width: `${percentage}%`,
                                        backgroundColor: COLORS.severity[severity],
                                    }}
                                />
                            </View>
                        </View>
                    );
                })}
            </View>
        </View>
    );
}
