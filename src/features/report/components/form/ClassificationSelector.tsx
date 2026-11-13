import { Pressable, Text, View } from "react-native";

import type { AccidentClassification } from "@/src/features/map/types/accident.types";
import { FieldLabel } from "@/src/features/report/components/form/FieldLabel";
import { CLASSIFICATION_OPTIONS } from "@/src/features/report/constants/reportOptions";
import { useTranslation } from "@/src/i18n";

type ClassificationSelectorProps = {
    classification: AccidentClassification | null;
    onSelect: (classification: AccidentClassification) => void;
};

export function ClassificationSelector({
    classification,
    onSelect,
}: ClassificationSelectorProps) {
    const { t } = useTranslation();
    return (
        <View className="mb-5 rounded-3xl bg-white dark:bg-[#1A1D24] p-4 shadow-lg">
            <FieldLabel label={t("report.form.classification")} required />
            <Text className="font-body mt-1 text-sm text-[#717786] dark:text-[#8B92A1]">
                {t("report.form.victimsQuestion")}
            </Text>
            <View className="mt-3 flex-row gap-2.5">
                {CLASSIFICATION_OPTIONS.map((option) => {
                    const selected = classification === option.value;
                    return (
                        <Pressable
                            key={option.value}
                            accessibilityRole="radio"
                            accessibilityState={{ selected }}
                            onPress={() =>
                                onSelect(option.value)
                            }
                            className={`min-h-12 flex-1 items-center justify-center rounded-2xl border px-3 py-3 ${
                                selected
                                    ? "border-[#0058BC] bg-[#E8F0FF] dark:bg-[#16253F]"
                                    : "border-[#C1C6D7]/60 dark:border-[#3A3F4B]/60 bg-white dark:bg-[#1A1D24]"
                            }`}
                        >
                            <Text
                                className={`text-sm font-body-semibold ${
                                    selected
                                        ? "text-[#0058BC] dark:text-[#3B87F5]"
                                        : "text-[#414755] dark:text-[#AAB0BD]"
                                }`}
                            >
                                {t(option.label)}
                            </Text>
                        </Pressable>
                    );
                })}
            </View>
        </View>
    );
}
