import { CircleAlert, Expand } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";

import { useTranslation } from "@/src/i18n";
import { useAppTheme } from "@/src/theme/useAppTheme";

type LocationIntroSheetProps = {
    bottomInset: number;
    onGotIt: () => void;
};

/** Conteúdo da folha inicial com as instruções de escolha do local. */
export function LocationIntroSheet({ bottomInset, onGotIt }: LocationIntroSheetProps) {
    const { t } = useTranslation();
    const { colors } = useAppTheme();
    return (
        <>
            <View className="mx-auto mb-6 h-1.5 w-12 rounded-full bg-[#717786]/40" />
            <View className="flex-1 justify-between">
                <View className="gap-4">
                    <Text className="text-center text-[22px] font-display text-[#181C23] dark:text-[#ECEEF4]">
                        {t("report.locationTitle")}
                    </Text>
                    <View className="flex-row items-center gap-2.5 rounded-2xl border border-[#ADC6FF]/30 bg-[#ADC6FF]/20 px-3 py-2.5">
                        <CircleAlert
                            size={19}
                            color={colors.primary}
                            strokeWidth={2.25}
                        />
                        <Text className="font-body flex-1 text-[15px] leading-[20px] text-[#414755] dark:text-[#AAB0BD]">
                            {t("report.locationHint")}
                        </Text>
                    </View>
                    <View className="flex-row items-center gap-2.5 rounded-2xl border border-[#ADC6FF]/30 bg-[#ADC6FF]/20 px-3 py-2.5">
                        <Expand
                            size={19}
                            color={colors.primary}
                            strokeWidth={2.25}
                        />
                        <Text className="font-body flex-1 text-[15px] leading-[20px] text-[#414755] dark:text-[#AAB0BD]">
                            {t("report.pinchHint")}
                        </Text>
                    </View>
                </View>
                <Pressable
                    accessibilityLabel={t("report.gotIt")}
                    onPress={onGotIt}
                    className="h-14 items-center justify-center rounded-xl bg-[#0058BC] shadow-lg"
                    style={{
                        marginBottom: Math.max(bottomInset + 16, 40),
                    }}
                >
                    <Text className="text-[17px] font-body-bold text-white">
                        {t("report.gotIt")}
                    </Text>
                </Pressable>
            </View>
        </>
    );
}
