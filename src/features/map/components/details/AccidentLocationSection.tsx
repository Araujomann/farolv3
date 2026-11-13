import { MapPin } from "lucide-react-native";
import { ActivityIndicator, Pressable, View } from "react-native";

import { Text } from "@/components/ui/text";
import { SectionCard } from "@/src/features/map/components/details/SectionCard";
import { useTranslation } from "@/src/i18n";
import { useAppTheme } from "@/src/theme/useAppTheme";

type AccidentLocationSectionProps = {
    address: string | null;
    isLoadingAddress: boolean;
    onOpenMap: () => void;
};

export function AccidentLocationSection({
    address,
    isLoadingAddress,
    onOpenMap,
}: AccidentLocationSectionProps) {
    const { t } = useTranslation();
    const { colors } = useAppTheme();
    return (
        <SectionCard title={t("accident.location")}>
            <View className="flex-row items-center gap-2">
                <MapPin size={18} color={colors.primary} />
                {isLoadingAddress ? (
                    <View className="flex-1 flex-row items-center gap-2">
                        <ActivityIndicator
                            size="small"
                            color={colors.primary}
                        />
                        <Text className="font-body flex-1 text-sm text-[#414755] dark:text-[#AAB0BD]">
                            {t("accident.searchingAddress")}
                        </Text>
                    </View>
                ) : (
                    <Text className="font-body flex-1 text-sm text-[#414755] dark:text-[#AAB0BD]">
                        {address ?? t("accident.addressUnavailable")}
                    </Text>
                )}
            </View>
            <Pressable
                accessibilityRole="button"
                onPress={onOpenMap}
                className="mt-3 items-center rounded-xl bg-[#F1F3FE] dark:bg-[#242833] py-3"
            >
                <Text className="text-sm font-body-semibold text-[#0058BC] dark:text-[#3B87F5]">
                    {t("accident.openLocation")}
                </Text>
            </Pressable>
        </SectionCard>
    );
}
