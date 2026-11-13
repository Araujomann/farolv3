import { CircleAlert, X } from "lucide-react-native";
import { ActivityIndicator, Modal, Pressable, View } from "react-native";

import { Text } from "@/components/ui/text";
import { useTranslation } from "@/src/i18n";
import { useAppTheme } from "@/src/theme/useAppTheme";

type LogoutDialogProps = {
    visible: boolean;
    isLoggingOut: boolean;
    onClose: () => void;
    onConfirm: () => void;
};

export function LogoutDialog({
    visible,
    isLoggingOut,
    onClose,
    onConfirm,
}: LogoutDialogProps) {
    const { t } = useTranslation();
    const { colors } = useAppTheme();

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            statusBarTranslucent
            navigationBarTranslucent
            onRequestClose={onClose}
        >
            <View className="flex-1 items-center justify-center bg-black/45 px-5">
                <View className="w-full max-w-[390px] rounded-[28px] bg-white dark:bg-[#1A1D24] p-5 shadow-2xl">
                    <View className="mb-5 flex-row items-start justify-between">
                        <View className="flex-1 flex-row items-center gap-3 pr-4">
                            <View className="h-11 w-11 items-center justify-center rounded-full bg-[#FFF1E8] dark:bg-[#2B2313]">
                                <CircleAlert
                                    size={24}
                                    color="#C64F00"
                                    strokeWidth={2.25}
                                />
                            </View>
                            <Text className="flex-1 text-[20px] font-display" style={{ color: colors.onSurface }}>
                                {t("profile.logoutTitle")}
                            </Text>
                        </View>
                        <Pressable
                            accessibilityLabel={t("profile.closeConfirmation")}
                            onPress={onClose}
                            disabled={isLoggingOut}
                            className="h-9 w-9 items-center justify-center rounded-full bg-[#F1F3FE] dark:bg-[#242833]"
                        >
                            <X size={18} color={colors.onSurfaceVariant} />
                        </Pressable>
                    </View>

                    <Text
                        className="font-body mb-6 text-[15px] leading-[21px]"
                        style={{ color: colors.onSurfaceVariant }}
                    >
                        {t("profile.logoutMessage")}
                    </Text>

                    <View className="gap-2.5">
                        <Pressable
                            accessibilityLabel={t("profile.stayLoggedIn")}
                            onPress={onClose}
                            disabled={isLoggingOut}
                            className="h-12 items-center justify-center rounded-xl bg-[#0058BC]"
                        >
                            <Text className="text-[15px] font-body-bold text-white">
                                {t("profile.stayLoggedIn")}
                            </Text>
                        </Pressable>
                        <Pressable
                            accessibilityLabel={t("profile.confirmLogout")}
                            onPress={onConfirm}
                            disabled={isLoggingOut}
                            className="h-12 items-center justify-center rounded-xl border border-[#F0B7A8] dark:border-[#5C2C26] bg-[#FFF8F5] dark:bg-[#2C1715]"
                        >
                            {isLoggingOut ? (
                                <ActivityIndicator size="small" color={colors.error} />
                            ) : (
                                <Text
                                    className="text-[15px] font-body-bold"
                                    style={{ color: colors.error }}
                                >
                                    {t("profile.confirmLogout")}
                                </Text>
                            )}
                        </Pressable>
                    </View>
                </View>
            </View>
        </Modal>
    );
}
