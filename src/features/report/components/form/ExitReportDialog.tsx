import { CircleAlert, X } from "lucide-react-native";
import { Modal, Pressable, Text, View } from "react-native";

import { useTranslation } from "@/src/i18n";
import { useAppTheme } from "@/src/theme/useAppTheme";

type ExitReportDialogProps = {
    visible: boolean;
    onClose: () => void;
    onConfirmExit: () => void;
};

/** Confirmação antes de abandonar um relato em preenchimento. */
export function ExitReportDialog({
    visible,
    onClose,
    onConfirmExit,
}: ExitReportDialogProps) {
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
                            <Text className="flex-1 text-[20px] font-display text-[#181C23] dark:text-[#ECEEF4]">
                                {t("report.form.leaveTitle")}
                            </Text>
                        </View>
                        <Pressable
                            accessibilityLabel={t("profile.closeConfirmation")}
                            onPress={onClose}
                            className="h-9 w-9 items-center justify-center rounded-full bg-[#F1F3FE] dark:bg-[#242833]"
                        >
                            <X size={18} color={colors.onSurfaceVariant} />
                        </Pressable>
                    </View>

                    <Text className="font-body mb-6 text-[15px] leading-[21px] text-[#414755] dark:text-[#AAB0BD]">
                        {t("report.form.leaveMessage")}
                    </Text>

                    <View className="gap-2.5">
                        <Pressable
                            accessibilityLabel={t("report.form.keepFillingLabel")}
                            onPress={onClose}
                            className="h-12 items-center justify-center rounded-xl bg-[#0058BC]"
                        >
                            <Text className="text-[15px] font-body-bold text-white">
                                {t("report.form.keepFilling")}
                            </Text>
                        </Pressable>
                        <Pressable
                            accessibilityLabel={t("report.form.leave")}
                            onPress={onConfirmExit}
                            className="h-12 items-center justify-center rounded-xl border border-[#F0B7A8] dark:border-[#5C2C26] bg-[#FFF8F5] dark:bg-[#2C1715]"
                        >
                            <Text className="text-[15px] font-body-bold text-[#B42318] dark:text-[#FF7B70]">
                                {t("report.form.leave")}
                            </Text>
                        </Pressable>
                    </View>
                </View>
            </View>
        </Modal>
    );
}
