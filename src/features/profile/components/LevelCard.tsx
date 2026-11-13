import { View } from "react-native";
import Reanimated from "react-native-reanimated";

import { Text } from "@/components/ui/text";
import {
    TitleColorText,
    useTitleBackgroundStyle,
    useTitleBorderStyle,
} from "@/src/features/profile/components/TitleColor";
import type { GamificationLevel } from "@/src/features/profile/constants/levels";
import { formatNumber, useTranslation } from "@/src/i18n";
import { useAppTheme } from "@/src/theme/useAppTheme";

type LevelCardProps = {
    level: GamificationLevel;
    approvedReportsCount: number;
    points: number;
};

export function LevelCard({ level, approvedReportsCount, points }: LevelCardProps) {
    const { colors } = useAppTheme();
    const { t, language } = useTranslation();
    const LevelIcon = level.icon;
    const borderStyle = useTitleBorderStyle();
    const iconBackgroundStyle = useTitleBackgroundStyle();

    return (
        <Reanimated.View
            className="mt-5 flex-row items-center gap-3 rounded-xl border p-6"
            style={[
                {
                    backgroundColor: colors.surface,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.08,
                    shadowRadius: 12,
                    elevation: 4,
                },
                borderStyle,
            ]}
        >
            {/* Left side: icon + label */}
            <View className="min-w-0 flex-1 flex-row items-center gap-3">
                <Reanimated.View
                    className="h-12 w-12 items-center justify-center rounded-full"
                    style={iconBackgroundStyle}
                >
                    <LevelIcon
                        size={24}
                        color="#FFFFFF"
                        strokeWidth={2}
                    />
                </Reanimated.View>
                <View className="min-w-0 flex-1">
                    <Text
                        className="text-[11px] font-body-semibold uppercase tracking-widest"
                        style={{ color: colors.onSurfaceVariant }}
                    >
                        {t("profile.currentLevel")}
                    </Text>
                    <TitleColorText
                        className="text-xl font-display-semibold"
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.8}
                    >
                        {t(`profile.levels.${level.key}.label`)}
                    </TitleColorText>
                    <Text
                        className="font-body mt-0.5 text-xs"
                        style={{ color: colors.onSurfaceVariant }}
                    >
                        {t("profile.approvedReports", {
                            count: approvedReportsCount,
                        })}
                    </Text>
                </View>
            </View>

            {/* Right side: points */}
            <View className="max-w-[38%] shrink-0 items-end">
                <Text
                    className="text-[24px] font-display leading-8"
                    style={{ color: colors.onSurface }}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.7}
                >
                    {formatNumber(points, language)}
                </Text>
                <Text
                    className="font-body text-[13px] leading-5"
                    style={{ color: colors.onSurfaceVariant }}
                >
                    {t("profile.points")}
                </Text>
            </View>
        </Reanimated.View>
    );
}
