import { BadgeCheck } from "lucide-react-native";
import { View } from "react-native";

import { Text } from "@/components/ui/text";
import {
    TitleColorIcon,
    TitleColorText,
} from "@/src/features/profile/components/TitleColor";
import { useTranslation } from "@/src/i18n";
import { useAppTheme } from "@/src/theme/useAppTheme";

export function TrustVotesCard({ count }: { count: number }) {
    const { t } = useTranslation();
    const { colors } = useAppTheme();
    return (
        <View className="mt-4 flex-row items-center gap-4 rounded-xl border border-[#D8E2FF] dark:border-[#3A3F4B] bg-white dark:bg-[#1A1D24] p-5">
            <View className="h-12 w-12 items-center justify-center rounded-full bg-[#EAF1FF] dark:bg-[#16253F]">
                <TitleColorIcon
                    icon={BadgeCheck}
                    size={25}
                    strokeWidth={2.2}
                />
            </View>
            <View className="flex-1">
                <Text
                    className="text-base font-body-semibold"
                    style={{ color: colors.onSurface }}
                >
                    {t("profile.trustSeals")}
                </Text>
                <Text
                    className="font-body mt-1 text-[13px]"
                    style={{ color: colors.onSurfaceVariant }}
                >
                    {t("profile.trustVotes", { count })}
                </Text>
            </View>
            <TitleColorText className="text-2xl font-display">
                {count}
            </TitleColorText>
        </View>
    );
}
