import { Text, View } from "react-native";

import { FieldLabel } from "@/src/features/report/components/form/FieldLabel";
import { formatDateTime, useTranslation } from "@/src/i18n";

export function DateTimeCard({ createdAt }: { createdAt: Date }) {
    const { t, language } = useTranslation();
    return (
        <View className="mb-5 rounded-3xl bg-white dark:bg-[#1A1D24] p-4 shadow-lg">
            <FieldLabel label={t("report.form.dateTime")} />
            <Text className="font-body mt-2 rounded-2xl border border-[#C1C6D7]/50 dark:border-[#3A3F4B]/50 bg-[#F8F9FF] dark:bg-[#0E1015] px-3 py-3 text-[15px] text-[#181C23] dark:text-[#ECEEF4]">
                {formatDateTime(createdAt, language)}
            </Text>
        </View>
    );
}
