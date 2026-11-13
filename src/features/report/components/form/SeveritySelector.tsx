import { Pressable, Text, View } from "react-native";

import { FieldLabel } from "@/src/features/report/components/form/FieldLabel";
import {
    SEVERITY_OPTIONS,
    type ReportSeverity,
} from "@/src/features/report/constants/reportOptions";
import { useTranslation } from "@/src/i18n";
import { useAppTheme } from "@/src/theme/useAppTheme";

type SeveritySelectorProps = {
    severity: ReportSeverity | null;
    onSelect: (severity: ReportSeverity) => void;
};

export function SeveritySelector({ severity, onSelect }: SeveritySelectorProps) {
    const { t } = useTranslation();
    const { colors } = useAppTheme();
    return (
        <View className="mb-5 rounded-3xl bg-white dark:bg-[#1A1D24] p-4 shadow-lg">
            <FieldLabel label={t("report.form.severity")} required />
            <Text className="font-body mt-1 text-sm text-[#717786] dark:text-[#8B92A1]">
                {t("report.form.severityQuestion")}
            </Text>
            <View className="mt-3 flex-row flex-wrap gap-2">
                {SEVERITY_OPTIONS.map((option) => {
                    const selected = severity === option.value;
                    return (
                        <Pressable
                            key={option.value}
                            accessibilityRole="radio"
                            accessibilityState={{ selected }}
                            onPress={() =>
                                onSelect(option.value)
                            }
                            className={`min-w-[45%] flex-1 flex-row items-center justify-center rounded-2xl border px-3 py-3 ${
                                selected
                                    ? "border-[#181C23] dark:border-[#ECEEF4]"
                                    : "border-[#C1C6D7]/60 dark:border-[#3A3F4B]/60"
                            }`}
                            style={{
                                backgroundColor: selected
                                    ? `${option.color}20`
                                    : colors.surface,
                            }}
                        >
                            <View
                                className="mr-2 h-3 w-3 rounded-full"
                                style={{
                                    backgroundColor: option.color,
                                }}
                            />
                            <Text className="text-sm font-body-semibold text-[#414755] dark:text-[#AAB0BD]">
                                {t(option.label)}
                            </Text>
                        </Pressable>
                    );
                })}
            </View>
        </View>
    );
}
