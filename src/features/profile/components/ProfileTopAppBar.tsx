import { ArrowLeft, Bell } from "lucide-react-native";
import { Pressable, View } from "react-native";

import { Text } from "@/components/ui/text";
import { TitleColorIcon } from "@/src/features/profile/components/TitleColor";
import { useTranslation } from "@/src/i18n";
import { useAppTheme } from "@/src/theme/useAppTheme";

type ProfileTopAppBarProps = {
    paddingTop: number;
    onBack: () => void;
    onNoticesPress: () => void;
};

export function ProfileTopAppBar({
    paddingTop,
    onBack,
    onNoticesPress,
}: ProfileTopAppBarProps) {
    const { t } = useTranslation();
    const { colors } = useAppTheme();
    return (
        <View
            className="flex-row items-center justify-between px-4"
            style={{
                backgroundColor: colors.surface,
                paddingTop: paddingTop + 4,
                height: 56 + paddingTop,
            }}
        >
            <Pressable
                onPress={onBack}
                hitSlop={8}
            >
                <View className="h-11 w-11 items-center justify-center">
                    <TitleColorIcon
                        icon={ArrowLeft}
                        size={24}
                        strokeWidth={2}
                    />
                </View>
            </Pressable>

            <Text
                className="text-lg font-body-semibold"
                style={{ color: colors.onSurface }}
            >
                {t("profile.title")}
            </Text>

            <Pressable
                accessibilityLabel={t("profile.notices")}
                accessibilityRole="button"
                hitSlop={8}
                onPress={onNoticesPress}
            >
                <View className="h-11 w-11 items-center justify-center">
                    <TitleColorIcon
                        icon={Bell}
                        size={24}
                        strokeWidth={2}
                    />
                </View>
            </Pressable>
        </View>
    );
}
