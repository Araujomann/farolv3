import { Clock3 } from "lucide-react-native";
import { View } from "react-native";

import { Text } from "@/components/ui/text";
import type { AccidentOverview } from "@/src/api/accidents";
import { CARD_SHADOW } from "@/src/features/home/constants";
import { useHomeColors } from "@/src/features/home/hooks/useHomeColors";
import { formatNumber, useTranslation } from "@/src/i18n";

export function TimeOfDayCard({
    periods,
}: {
    periods: AccidentOverview["time_of_day"];
}) {
    const { t } = useTranslation();
    const COLORS = useHomeColors();
    const maxCount = Math.max(1, ...periods.map((period) => period.count));

    return (
        <View
            className="rounded-3xl bg-white dark:bg-[#1A1D24] p-4"
            style={CARD_SHADOW}
        >
            <View className="flex-row items-center">
                <Clock3 size={21} color={COLORS.primary} strokeWidth={2.2} />
                <Text
                    className="ml-2 flex-1 text-base font-body-bold"
                    style={{ color: COLORS.text }}
                >
                    {t("home.byTimeOfDay")}
                </Text>
                <Text
                    className="font-body text-xs"
                    style={{ color: COLORS.secondaryText }}
                >
                    {t("home.last30Days")}
                </Text>
            </View>
            <View className="mt-5 h-[134px] flex-row items-end justify-between">
                {periods.map((period) => {
                    const height =
                        period.count === 0
                            ? 3
                            : Math.max(10, (period.count / maxCount) * 96);

                    return (
                        <View
                            key={period.start_hour}
                            className="flex-1 items-center justify-end"
                        >
                            {period.count > 0 ? (
                                <Text
                                    className="mb-1 text-[10px] font-body-semibold"
                                    style={{ color: COLORS.secondaryText }}
                                >
                                    {formatNumber(period.count)}
                                </Text>
                            ) : (
                                <View className="mb-1 h-3" />
                            )}
                            <View
                                className="w-5 rounded-t-md"
                                style={{
                                    height,
                                    backgroundColor: COLORS.primary,
                                    opacity: period.count === 0 ? 0.2 : 0.88,
                                }}
                            />
                            <Text
                                className="font-body mt-2 text-[9px]"
                                style={{ color: COLORS.secondaryText }}
                            >
                                {`${String(period.start_hour).padStart(2, "0")}–${String(
                                    period.start_hour + 3,
                                ).padStart(2, "0")}`}
                            </Text>
                        </View>
                    );
                })}
            </View>
        </View>
    );
}
