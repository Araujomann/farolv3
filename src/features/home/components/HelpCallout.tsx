import { ChevronRight } from "lucide-react-native";
import { Pressable, View } from "react-native";

import { Text } from "@/components/ui/text";
import { useHomeColors } from "@/src/features/home/hooks/useHomeColors";
import { useTranslation } from "@/src/i18n";

/** Chamada final da Home convidando a relatar um acidente. */
export function HelpCallout({ onReportPress }: { onReportPress: () => void }) {
    const { t } = useTranslation();
    const COLORS = useHomeColors();
    return (
        <View
            className="rounded-3xl p-5"
            style={{ backgroundColor: COLORS.primary }}
        >
            <Text className="text-lg font-body-bold text-white">
                {t("home.helpTitle")}
            </Text>
            <Text className="font-body mt-1 text-sm leading-5 text-white/85">
                {t("home.helpBody")}
            </Text>
            <Pressable
                accessibilityRole="button"
                onPress={onReportPress}
                className="mt-4 flex-row items-center self-start rounded-xl bg-white dark:bg-[#1A1D24] px-4 py-2.5"
            >
                <Text
                    className="text-sm font-body-bold"
                    style={{ color: COLORS.primary }}
                >
                    {t("home.reportAccident")}
                </Text>
                <ChevronRight
                    size={17}
                    color={COLORS.primary}
                    style={{ marginLeft: 4 }}
                />
            </Pressable>
        </View>
    );
}
