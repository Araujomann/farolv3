import { useRouter } from "expo-router";
import { ChevronRight, FileText, ShieldCheck } from "lucide-react-native";
import { useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Text } from "@/components/ui/text";
import { acceptTerms } from "@/src/api/profile";
import { tr, useTranslation } from "@/src/i18n";
import { useAuthStore } from "@/src/store/authStore";
import { useAppTheme } from "@/src/theme/useAppTheme";

import { TERMS_VERSION } from "../legalConfig";

/**
 * Pede o aceite da versão atual dos Termos de Uso e da Política de
 * Privacidade. O layout raiz traz para cá quem tem sessão mas não aceitou
 * esta versão (contas anteriores ao registro do aceite ou textos alterados);
 * depois do aceite, ele mesmo segue para a área logada.
 */
export default function TermsAcceptanceScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { colors } = useAppTheme();
    const { t } = useTranslation();
    const setUser = useAuthStore((state) => state.setUser);
    const signOut = useAuthStore((state) => state.signOut);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleAccept = async () => {
        if (isSubmitting) return;
        setIsSubmitting(true);

        try {
            setUser(await acceptTerms(TERMS_VERSION));
        } catch {
            Alert.alert(
                tr("legal.accept.errorTitle"),
                tr("legal.accept.errorMessage"),
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <View className="flex-1" style={{ backgroundColor: colors.background }}>
            <ScrollView
                contentContainerStyle={{
                    paddingHorizontal: 20,
                    paddingTop: insets.top + 48,
                    paddingBottom: insets.bottom + 32,
                    flexGrow: 1,
                }}
            >
                <View
                    className="h-14 w-14 items-center justify-center rounded-2xl"
                    style={{ backgroundColor: colors.primaryContainer }}
                >
                    <ShieldCheck size={30} color={colors.primary} />
                </View>

                <Text
                    accessibilityRole="header"
                    className="mt-5 text-[24px] font-display"
                    style={{ color: colors.onSurface }}
                >
                    {t("legal.accept.title")}
                </Text>
                <Text
                    className="font-body mt-3 text-[15px] leading-[23px]"
                    style={{ color: colors.onSurfaceVariant }}
                >
                    {t("legal.accept.message")}
                </Text>

                <View
                    className="mt-6 overflow-hidden rounded-xl"
                    style={{ backgroundColor: colors.surface }}
                >
                    <DocumentLink
                        label={t("legal.accept.readTerms")}
                        onPress={() => router.push("/legal/terms")}
                    />
                    <View
                        className="h-px"
                        style={{ marginLeft: 56, backgroundColor: colors.divider }}
                    />
                    <DocumentLink
                        label={t("legal.accept.readPrivacy")}
                        onPress={() => router.push("/legal/privacy")}
                    />
                </View>

                <View className="flex-1" />

                <View className="mt-8 gap-3">
                    <Pressable
                        accessibilityRole="button"
                        accessibilityState={{ busy: isSubmitting }}
                        disabled={isSubmitting}
                        onPress={() => void handleAccept()}
                        className="h-12 items-center justify-center rounded-xl"
                        style={({ pressed }) => ({
                            backgroundColor: colors.primary,
                            opacity: pressed || isSubmitting ? 0.8 : 1,
                        })}
                    >
                        {isSubmitting ? (
                            <ActivityIndicator color={colors.onPrimary} />
                        ) : (
                            <Text
                                className="text-[16px] font-body-semibold"
                                style={{ color: colors.onPrimary }}
                            >
                                {t("legal.accept.confirm")}
                            </Text>
                        )}
                    </Pressable>
                    <Pressable
                        accessibilityRole="button"
                        disabled={isSubmitting}
                        onPress={() => void signOut()}
                        className="h-12 items-center justify-center rounded-xl"
                    >
                        <Text
                            className="text-[15px] font-body-semibold"
                            style={{ color: colors.onSurfaceVariant }}
                        >
                            {t("legal.accept.signOut")}
                        </Text>
                    </Pressable>
                </View>
            </ScrollView>
        </View>
    );
}

function DocumentLink({ label, onPress }: { label: string; onPress: () => void }) {
    const { colors } = useAppTheme();

    return (
        <Pressable
            accessibilityRole="link"
            onPress={onPress}
            className="flex-row items-center justify-between px-4 py-4"
            style={({ pressed }) => ({
                backgroundColor: pressed ? colors.surfaceMuted : colors.surface,
            })}
        >
            <View className="flex-1 flex-row items-center gap-4 pr-3">
                <FileText size={22} color={colors.primary} />
                <Text
                    className="font-body text-base"
                    style={{ color: colors.onSurface }}
                >
                    {label}
                </Text>
            </View>
            <ChevronRight size={20} color={colors.outline} />
        </Pressable>
    );
}
