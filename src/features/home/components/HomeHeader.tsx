import { Mail, MapPin } from "lucide-react-native";
import { Image, Pressable, View } from "react-native";

import { Text } from "@/components/ui/text";
import { useHomeColors } from "@/src/features/home/hooks/useHomeColors";
import { useTranslation } from "@/src/i18n";

type HomeHeaderProps = {
    isEmailVerified?: boolean;
    firstName: string;
    onVerifyEmail: () => void;
};

/** Aviso de verificação de e-mail, marca, saudação e cidade. */
export function HomeHeader({
    isEmailVerified,
    firstName,
    onVerifyEmail,
}: HomeHeaderProps) {
    const { t } = useTranslation();
    const COLORS = useHomeColors();

    return (
        <View className="mb-5">
            {/* Badge de Verificação de E-mail */}
            {!isEmailVerified && (
                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={t("home.verifyEmailLabel")}
                    onPress={onVerifyEmail}
                    className="mb-3 flex-row items-center gap-2 rounded-xl bg-amber-100 dark:bg-[#2B2313] px-3 py-2"
                >
                    <Mail size={16} color="#F59E0B" strokeWidth={2} />
                    <Text className="flex-1 text-xs font-body-medium text-amber-700 dark:text-[#F5D58A]">
                        {t("home.verifyEmailBanner")}
                    </Text>
                    <Text className="text-xs font-body-bold text-amber-800 dark:text-[#F5D58A]">
                        {t("home.verify")}
                    </Text>
                </Pressable>
            )}
            <View className="mb-5 flex-row items-center">
                <Image
                    source={require("../../../../assets/images/farol-logo.png")}
                    accessibilityIgnoresInvertColors
                    resizeMode="contain"
                    className="mr-2"
                    style={{ width: 30, height: 36 }}
                />
                <Text
                    className="text-xl font-display-extrabold"
                    style={{ color: COLORS.text }}
                >
                    Farol
                </Text>
            </View>
            <Text
                className="text-[25px] font-display leading-8"
                style={{ color: COLORS.text }}
            >
                {t("home.greeting", { name: firstName })}
            </Text>
            <Text
                className="font-body mt-1 text-sm leading-5"
                style={{ color: COLORS.secondaryText }}
            >
                {t("home.tagline")}
            </Text>
            <View className="mt-3 flex-row items-center self-start rounded-full bg-white dark:bg-[#1A1D24] px-3 py-1.5">
                <MapPin size={13} color={COLORS.primary} />
                <Text
                    className="ml-1.5 text-xs font-body-semibold"
                    style={{ color: COLORS.primary }}
                >
                    Imperatriz, MA
                </Text>
            </View>
        </View>
    );
}
