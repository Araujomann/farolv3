import { useState } from "react";
import { Check, ChevronDown, Clock3, RefreshCw } from "lucide-react-native";
import { ActivityIndicator, Modal, Pressable, View } from "react-native";

import { Text } from "@/components/ui/text";
import type { AccidentOverview } from "@/src/api/accidents";
import { CARD_SHADOW } from "@/src/features/home/constants";
import { useHomeColors } from "@/src/features/home/hooks/useHomeColors";
import {
    useTimeOfDayStats,
    type TimeOfDayPeriod,
} from "@/src/features/home/hooks/useTimeOfDayStats";
import { TEMPORAL_PERIOD_OPTIONS } from "@/src/features/map/utils/temporalPeriod";
import { formatNumber, useTranslation, type TranslationKey } from "@/src/i18n";

/** Opções do seletor: o padrão do panorama e os mesmos períodos do filtro do mapa. */
const PERIOD_OPTIONS: { value: TimeOfDayPeriod; label: TranslationKey }[] = [
    { value: "last30Days", label: "home.last30Days" },
    ...TEMPORAL_PERIOD_OPTIONS.map(({ value, label }) => ({ value, label })),
];

export function TimeOfDayCard({
    periods: overviewPeriods,
}: {
    periods: AccidentOverview["time_of_day"];
}) {
    const { t } = useTranslation();
    const COLORS = useHomeColors();
    const [isSelectOpen, setIsSelectOpen] = useState(false);
    const { period, setPeriod, timeOfDay, isLoading, hasError, retry } =
        useTimeOfDayStats(overviewPeriods);
    const periods = timeOfDay ?? overviewPeriods.map((item) => ({ ...item, count: 0 }));
    const maxCount = Math.max(1, ...periods.map((item) => item.count));
    const selectedLabel = t(
        PERIOD_OPTIONS.find((option) => option.value === period)?.label ??
            "home.last30Days",
    );

    const selectPeriod = (value: TimeOfDayPeriod) => {
        setIsSelectOpen(false);
        setPeriod(value);
    };

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
                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`${t("home.timeOfDayPeriod")}: ${selectedLabel}`}
                    onPress={() => setIsSelectOpen(true)}
                    hitSlop={8}
                    className="flex-row items-center rounded-full border px-2.5 py-1"
                    style={{ borderColor: COLORS.border }}
                >
                    <Text
                        className="font-body-semibold text-xs"
                        style={{ color: COLORS.secondaryText }}
                    >
                        {selectedLabel}
                    </Text>
                    <ChevronDown
                        size={14}
                        color={COLORS.secondaryText}
                        style={{ marginLeft: 4 }}
                    />
                </Pressable>
            </View>

            {hasError ? (
                <Pressable
                    accessibilityRole="button"
                    onPress={retry}
                    className="mt-5 h-[134px] items-center justify-center"
                >
                    <RefreshCw size={18} color={COLORS.primary} />
                    <Text
                        className="font-body mt-2 text-center text-xs"
                        style={{ color: COLORS.secondaryText }}
                    >
                        {t("home.timeOfDayError")}
                    </Text>
                    <Text
                        className="font-body-semibold mt-1 text-xs"
                        style={{ color: COLORS.primary }}
                    >
                        {t("common.retry")}
                    </Text>
                </Pressable>
            ) : (
                <View className="mt-5 h-[134px]">
                    <View
                        className="flex-1 flex-row items-end justify-between"
                        style={{ opacity: isLoading ? 0.35 : 1 }}
                    >
                        {periods.map((item) => {
                            const height =
                                item.count === 0
                                    ? 3
                                    : Math.max(10, (item.count / maxCount) * 96);

                            return (
                                <View
                                    key={item.start_hour}
                                    className="flex-1 items-center justify-end"
                                >
                                    {item.count > 0 ? (
                                        <Text
                                            className="mb-1 text-[10px] font-body-semibold"
                                            style={{ color: COLORS.secondaryText }}
                                        >
                                            {formatNumber(item.count)}
                                        </Text>
                                    ) : (
                                        <View className="mb-1 h-3" />
                                    )}
                                    <View
                                        className="w-5 rounded-t-md"
                                        style={{
                                            height,
                                            backgroundColor: COLORS.primary,
                                            opacity: item.count === 0 ? 0.2 : 0.88,
                                        }}
                                    />
                                    <Text
                                        className="font-body mt-2 text-[9px]"
                                        style={{ color: COLORS.secondaryText }}
                                    >
                                        {`${String(item.start_hour).padStart(2, "0")}–${String(
                                            item.start_hour + 3,
                                        ).padStart(2, "0")}`}
                                    </Text>
                                </View>
                            );
                        })}
                    </View>
                    {isLoading ? (
                        <View className="absolute inset-0 items-center justify-center">
                            <ActivityIndicator color={COLORS.primary} />
                        </View>
                    ) : null}
                </View>
            )}

            <Modal
                visible={isSelectOpen}
                transparent
                animationType="fade"
                statusBarTranslucent
                navigationBarTranslucent
                onRequestClose={() => setIsSelectOpen(false)}
            >
                <Pressable
                    accessibilityLabel={t("common.close")}
                    onPress={() => setIsSelectOpen(false)}
                    className="flex-1 items-center justify-center bg-black/45 px-8"
                >
                    <Pressable
                        onPress={() => undefined}
                        className="w-full max-w-[320px] rounded-3xl bg-white dark:bg-[#1A1D24] py-3 shadow-2xl"
                    >
                        <Text
                            className="font-body-bold px-5 pb-2 pt-1 text-base"
                            style={{ color: COLORS.text }}
                        >
                            {t("home.timeOfDayPeriod")}
                        </Text>
                        {PERIOD_OPTIONS.map((option) => {
                            const isSelected = option.value === period;

                            return (
                                <Pressable
                                    key={option.value}
                                    accessibilityRole="radio"
                                    accessibilityState={{ selected: isSelected }}
                                    onPress={() => selectPeriod(option.value)}
                                    className="flex-row items-center px-5 py-3"
                                >
                                    <Text
                                        className={`flex-1 text-[15px] ${
                                            isSelected ? "font-body-bold" : "font-body"
                                        }`}
                                        style={{
                                            color: isSelected ? COLORS.primary : COLORS.text,
                                        }}
                                    >
                                        {t(option.label)}
                                    </Text>
                                    {isSelected ? (
                                        <Check size={18} color={COLORS.primary} />
                                    ) : null}
                                </Pressable>
                            );
                        })}
                    </Pressable>
                </Pressable>
            </Modal>
        </View>
    );
}
