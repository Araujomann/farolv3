import { BadgeCheck } from "lucide-react-native";
import { View } from "react-native";

import { Text } from "@/components/ui/text";
import { SectionCard } from "@/src/features/map/components/details/SectionCard";
import type { AccidentDetail } from "@/src/features/map/types/accident.types";
import { formatDateTime as formatDate, useTranslation } from "@/src/i18n";
import { useAppTheme } from "@/src/theme/useAppTheme";

/** Origem do registro (PRF ou comunidade) e data de criação. */
export function AccidentSourceSection({
    accident,
}: {
    accident: AccidentDetail;
}) {
    const { t } = useTranslation();
    const { colors } = useAppTheme();
    return (
        <SectionCard title={t("accident.reportSource")}>
            <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-2">
                    <BadgeCheck
                        size={20}
                        color={accident.source === "PRF" ? colors.success : colors.primary}
                    />
                    <Text className="text-sm font-body-semibold text-[#181C23] dark:text-[#ECEEF4]">
                        {accident.source === "PRF"
                            ? t("accident.sourcePrf")
                            : t("accident.sourceCommunity")}
                    </Text>
                </View>
                <Text className="font-body text-xs text-gray-500 dark:text-[#8B92A1]">
                    {formatDate(accident.created_at)}
                </Text>
            </View>
        </SectionCard>
    );
}
