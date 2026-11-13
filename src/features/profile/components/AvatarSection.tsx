import { CircleAlert, User as UserIcon } from "lucide-react-native";
import { Pressable, View } from "react-native";
import Reanimated, { useAnimatedStyle } from "react-native-reanimated";

import { Text } from "@/components/ui/text";
import { useTitleColor } from "@/src/features/profile/components/TitleColor";
import type { GamificationLevel } from "@/src/features/profile/constants/levels";
import { useTranslation } from "@/src/i18n";
import { useAppTheme } from "@/src/theme/useAppTheme";

type AvatarSectionProps = {
    name?: string;
    email?: string;
    level: GamificationLevel;
    is_email_verified?: boolean;
    onVerifyEmail: () => void;
};

export function AvatarSection({ name, email, level, is_email_verified, onVerifyEmail }: AvatarSectionProps) {
    const { colors } = useAppTheme();
    const { t } = useTranslation();
    const levelLabel = t(`profile.levels.${level.key}.label`);
    const titleColor = useTitleColor();
    const borderStyle = useAnimatedStyle(() => ({
        borderColor: titleColor.value,
    }));

    return (
        <View className="items-center justify-center pb-2 pt-5">
            <View
                accessibilityLabel={t("profile.avatarLabel", { level: levelLabel })}
                className="h-[112px] w-[112px] items-center justify-center rounded-full border-[3px] p-[4px] relative"
                style={{
                    borderColor: "transparent",
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                    elevation: 3,
                }}
            >
                {/* Anel com a cor do título (animado na thread de UI) */}
                <Reanimated.View
                    pointerEvents="none"
                    style={[
                        {
                            position: "absolute",
                            top: -3,
                            right: -3,
                            bottom: -3,
                            left: -3,
                            borderRadius: 999,
                            borderWidth: 3,
                        },
                        borderStyle,
                    ]}
                />
                <View className="h-full w-full items-center justify-center rounded-full bg-[#E0E7F1] dark:bg-[#242833]">
                    <UserIcon size={44} color={colors.outline} strokeWidth={1.6} />
                </View>

                {/* Verificação de e-mail badge */}
                {!is_email_verified && (
                    <View
                        className="absolute bottom-0 right-0 h-6 w-6 items-center justify-center rounded-full bg-red-500 border-2 border-white dark:border-[#1A1D24]"
                        accessibilityLabel={t("profile.emailNotVerified")}
                    >
                        <CircleAlert size={12} color="#FFFFFF" strokeWidth={1.5} />
                    </View>
                )}
            </View>

            <Text
                className="mt-3 text-[22px] font-display leading-7"
                style={{ color: colors.onSurface }}
            >
                {name ?? t("profile.defaultName")}
            </Text>

            <View className="flex-row items-center gap-2 mt-1">
                <Text
                    className="font-body text-[15px] leading-5"
                    style={{ color: colors.onSurfaceVariant }}
                >
                    {email?.trim() || "—"}
                </Text>
                {!is_email_verified && (
                    <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={t("profile.emailNotVerifiedAction")}
                        onPress={onVerifyEmail}
                        hitSlop={8}
                    >
                        <Text
                            className="text-[12px] font-body-semibold underline"
                            style={{ color: "#F59E0B" }}
                        >
                            {t("profile.verifyNow")}
                        </Text>
                    </Pressable>
                )}
            </View>
        </View>
    );
}
