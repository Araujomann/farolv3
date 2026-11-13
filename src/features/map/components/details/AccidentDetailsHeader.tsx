import { ArrowLeft } from "lucide-react-native";
import { Pressable, View } from "react-native";

import { Text } from "@/components/ui/text";
import { useTranslation } from "@/src/i18n";
import { useAppTheme } from "@/src/theme/useAppTheme";

type AccidentDetailsHeaderProps = {
    paddingTop: number;
    onBack: () => void;
};

export function AccidentDetailsHeader({
    paddingTop,
    onBack,
}: AccidentDetailsHeaderProps) {
    const { t } = useTranslation();
    const { colors } = useAppTheme();
    return (
        <View
            className="flex-row items-center border-b border-gray-100 dark:border-[#3A3F4B] bg-white dark:bg-[#1A1D24] px-4 pb-3"
            style={{ paddingTop }}
        >
            <Pressable
                accessibilityRole="button"
                accessibilityLabel={t("accident.backToMap")}
                onPress={onBack}
                className="h-10 w-10 items-center justify-center rounded-full bg-gray-50 dark:bg-[#242833]"
            >
                <ArrowLeft size={20} color={colors.primary} />
            </Pressable>
            <Text className="flex-1 text-center text-lg font-body-bold text-[#181C23] dark:text-[#ECEEF4]">
                {t("accident.title")}
            </Text>
            <View className="h-10 w-10" />
        </View>
    );
}
