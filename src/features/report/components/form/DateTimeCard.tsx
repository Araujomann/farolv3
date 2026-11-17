import { Text, TextInput, View } from "react-native";

import { FieldLabel } from "@/src/features/report/components/form/FieldLabel";
import { maskOccurrenceTime } from "@/src/features/report/utils/occurrenceTime";
import { getDateTimeFormatter, useTranslation } from "@/src/i18n";
import { useAppTheme } from "@/src/theme/useAppTheme";

const SHORT_DATE: Intl.DateTimeFormatOptions = { dateStyle: "short" };

type DateTimeCardProps = {
    /** Dia do relato, exibido ao lado do horário. */
    reportDate: Date;
    /** Horário do acidente digitado pelo usuário, em "HH:MM" (24h). */
    time: string;
    onChangeTime: (time: string) => void;
};

/**
 * Data e horário do acidente. O dia é o do relato; o horário é informado
 * pelo usuário, porque o acidente pode ter acontecido antes do relato.
 */
export function DateTimeCard({
    reportDate,
    time,
    onChangeTime,
}: DateTimeCardProps) {
    const { t, language } = useTranslation();
    const { colors } = useAppTheme();
    return (
        <View className="mb-5 rounded-3xl bg-white dark:bg-[#1A1D24] p-4 shadow-lg">
            <FieldLabel label={t("report.form.dateTime")} required />
            <Text className="font-body mt-1 text-sm text-[#717786] dark:text-[#8B92A1]">
                {t("report.form.timeQuestion")}
            </Text>
            <View className="mt-3 flex-row gap-2.5">
                <Text className="font-body flex-1 rounded-2xl border border-[#C1C6D7]/50 dark:border-[#3A3F4B]/50 bg-[#F8F9FF] dark:bg-[#0E1015] px-3 py-3 text-[15px] text-[#717786] dark:text-[#8B92A1]">
                    {getDateTimeFormatter(language, SHORT_DATE).format(reportDate)}
                </Text>
                <TextInput
                    accessibilityLabel={t("report.form.timeLabel")}
                    accessibilityHint={t("report.form.timeHint")}
                    value={time}
                    onChangeText={(text) => onChangeTime(maskOccurrenceTime(text))}
                    keyboardType="number-pad"
                    maxLength={5}
                    placeholder={t("report.form.timePlaceholder")}
                    placeholderTextColor={colors.outline}
                    className="font-body flex-1 rounded-2xl border border-[#C1C6D7]/60 dark:border-[#3A3F4B]/60 bg-[#F8F9FF] dark:bg-[#0E1015] px-3 py-3 text-[15px] text-[#181C23] dark:text-[#ECEEF4]"
                />
            </View>
            <Text className="font-body mt-2 text-xs text-[#717786] dark:text-[#8B92A1]">
                {t("report.form.timeHint")}
            </Text>
        </View>
    );
}
