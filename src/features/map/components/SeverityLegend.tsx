import { Text, View } from "react-native";

import { MARKER_COLORS } from "@/src/features/map/constants/mapConfig";
import { useTranslation } from "@/src/i18n";

/** Legenda de cores dos marcadores por severidade. */
export function SeverityLegend() {
    const { t } = useTranslation();
    return (
        <View className="rounded-2xl bg-white/95 dark:bg-[#1A1D24]/95 px-3 py-2 shadow-lg">
            <Text className="mb-1 text-xs font-body-bold uppercase tracking-wide text-gray-500 dark:text-[#8B92A1]">
                {t("map.severity")}
            </Text>
            <View className="flex-row items-center gap-3">
                <LegendItem
                    color={MARKER_COLORS.low}
                    label={t("enums.severity.low")}
                />
                <LegendItem
                    color={MARKER_COLORS.medium}
                    label={t("enums.severity.medium")}
                />
                <LegendItem
                    color={MARKER_COLORS.high}
                    label={t("enums.severity.high")}
                />
                <LegendItem
                    color={MARKER_COLORS.critical}
                    label={t("enums.severity.critical")}
                />
            </View>
        </View>
    );
}

function LegendItem({ color, label }: { color: string; label: string }) {
    return (
        <View className="flex-row items-center gap-1">
            <View
                className="h-2.5 w-2.5 rounded-full border border-white dark:border-[#1A1D24]"
                style={{ backgroundColor: color }}
            />
            <Text className="text-[11px] font-body-medium text-gray-700 dark:text-[#AAB0BD]">
                {label}
            </Text>
        </View>
    );
}
