import {
    ChevronRight,
    History,
    Info,
    Settings,
    type LucideIcon,
} from "lucide-react-native";
import { Pressable, View } from "react-native";

import { Text } from "@/components/ui/text";
import { TitleColorIcon } from "@/src/features/profile/components/TitleColor";
import { useTranslation } from "@/src/i18n";
import { useAppTheme } from "@/src/theme/useAppTheme";

type ProfileMenuRowProps = {
    icon: LucideIcon;
    label: string;
    onPress?: () => void;
};

function ProfileMenuRow({
    icon: Icon,
    label,
    onPress,
}: ProfileMenuRowProps) {
    const { colors } = useAppTheme();
    return (
        <Pressable
            onPress={onPress}
            className="flex-row items-center justify-between px-5 py-4"
            style={({ pressed }) => ({
                backgroundColor: pressed ? colors.surfaceMuted : colors.surface,
            })}
        >
            <View className="flex-row items-center gap-4">
                <View
                    className="h-8 w-8 items-center justify-center rounded-lg"
                    style={{ backgroundColor: colors.surfaceMuted }}
                >
                    <TitleColorIcon icon={Icon} size={20} strokeWidth={2} />
                </View>
                <Text
                    className="font-body text-base"
                    style={{ color: colors.onSurface }}
                >
                    {label}
                </Text>
            </View>
            <TitleColorIcon icon={ChevronRight} size={20} strokeWidth={2} />
        </Pressable>
    );
}

function ProfileMenuDivider() {
    const { colors } = useAppTheme();
    return (
        <View
            className="h-px"
            style={{ marginLeft: 68, backgroundColor: colors.divider }}
        />
    );
}

type ProfileMenuProps = {
    onReportsPress: () => void;
    onSettingsPress: () => void;
    onAboutPress: () => void;
};

export function ProfileMenu({
    onReportsPress,
    onSettingsPress,
    onAboutPress,
}: ProfileMenuProps) {
    const { t } = useTranslation();
    const { colors } = useAppTheme();

    return (
        <View
            className="mt-5 overflow-hidden rounded-xl"
            style={{
                backgroundColor: colors.surface,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 4,
                elevation: 2,
            }}
        >
            <ProfileMenuRow
                icon={History}
                label={t("profile.myReports")}
                onPress={onReportsPress}
            />
            <ProfileMenuDivider />

            <ProfileMenuRow
                icon={Settings}
                label={t("profile.settings")}
                onPress={onSettingsPress}
            />
            <ProfileMenuDivider />

            <ProfileMenuRow
                icon={Info}
                label={t("profile.about")}
                onPress={onAboutPress}
            />
        </View>
    );
}
