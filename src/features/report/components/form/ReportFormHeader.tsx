import { ArrowLeft } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";

import { useTranslation } from "@/src/i18n";
import { useAppTheme } from "@/src/theme/useAppTheme";

export function ReportFormHeader({ onBack }: { onBack: () => void }) {
    const { t } = useTranslation();
    const { colors } = useAppTheme();
    return (
        <View className="mb-6 flex-row items-center">
            <Pressable
                accessibilityLabel={t("report.form.backToLocation")}
                onPress={onBack}
                className="h-11 w-11 items-center justify-center rounded-full bg-white dark:bg-[#1A1D24] shadow-md"
            >
                <ArrowLeft size={22} color={colors.onSurface} />
            </Pressable>
            <View className="ml-3 flex-1">
                <Text className="text-[13px] font-body-semibold uppercase tracking-wide text-[#0058BC] dark:text-[#3B87F5]">
                    {t("report.form.newReport")}
                </Text>
                <Text className="mt-0.5 text-[25px] font-display tracking-tight text-[#181C23] dark:text-[#ECEEF4]">
                    {t("report.form.title")}
                </Text>
            </View>
        </View>
    );
}
