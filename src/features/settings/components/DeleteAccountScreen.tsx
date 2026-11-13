import { isAxiosError } from "axios";
import { useRouter } from "expo-router";
import {
    ArrowLeft,
    Eye,
    EyeOff,
    TriangleAlert,
} from "lucide-react-native";
import { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    TextInput,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Text } from "@/components/ui/text";
import { deleteMyAccount } from "@/src/api/profile";
import { useTranslation, type TranslationKey } from "@/src/i18n";
import { useAuthStore } from "@/src/store/authStore";
import { useAppTheme } from "@/src/theme/useAppTheme";

const CONSEQUENCES: TranslationKey[] = [
    "deleteAccount.consequenceProfile",
    "deleteAccount.consequenceSession",
    "deleteAccount.consequenceReports",
];

const ERROR_KEYS: Record<string, TranslationKey> = {
    INVALID_PASSWORD: "deleteAccount.wrongPassword",
    PASSWORD_REQUIRED: "deleteAccount.passwordRequired",
    STAFF_ACCOUNT_DELETION_FORBIDDEN: "deleteAccount.staffBlocked",
};

export default function DeleteAccountScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { colors } = useAppTheme();
    const { t } = useTranslation();
    const clearDeletedAccountSession = useAuthStore(
        (state) => state.clearDeletedAccountSession,
    );
    const [password, setPassword] = useState("");
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleDelete = async () => {
        if (!password) {
            setError(t("deleteAccount.passwordRequired"));
            return;
        }

        setIsDeleting(true);
        setError(null);
        try {
            await deleteMyAccount(password);
        } catch (cause) {
            const code = isAxiosError(cause)
                ? cause.response?.data?.error?.code
                : undefined;
            setError(t(ERROR_KEYS[code] ?? "deleteAccount.genericError"));
            setIsDeleting(false);
            return;
        }

        // A conta já não existe: limpa a sessão local e volta ao login.
        await clearDeletedAccountSession();
        router.replace("/(auth)/login");
        Alert.alert(
            t("deleteAccount.successTitle"),
            t("deleteAccount.successMessage"),
        );
    };

    return (
        <KeyboardAvoidingView
            className="flex-1"
            style={{ backgroundColor: colors.background }}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
            <View
                className="flex-row items-center justify-between px-4"
                style={{
                    backgroundColor: colors.surface,
                    height: 56 + insets.top,
                    paddingTop: insets.top,
                }}
            >
                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={t("common.back")}
                    onPress={() => router.back()}
                    disabled={isDeleting}
                    className="h-11 w-11 items-center justify-center"
                >
                    <ArrowLeft size={24} color={colors.primary} />
                </Pressable>
                <Text
                    className="text-lg font-body-semibold"
                    style={{ color: colors.onSurface }}
                >
                    {t("deleteAccount.title")}
                </Text>
                <View className="h-11 w-11" />
            </View>

            <ScrollView
                contentContainerStyle={{
                    paddingHorizontal: 16,
                    paddingTop: 20,
                    paddingBottom: insets.bottom + 32,
                }}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                <View
                    className="rounded-2xl border p-5"
                    style={{
                        backgroundColor: colors.errorContainer,
                        borderColor: colors.errorBorder,
                    }}
                >
                    <View className="mb-3 flex-row items-center gap-3">
                        <TriangleAlert
                            size={24}
                            color={colors.error}
                            strokeWidth={2.2}
                        />
                        <Text
                            className="flex-1 text-[17px] font-display-semibold"
                            style={{ color: colors.error }}
                        >
                            {t("deleteAccount.warningTitle")}
                        </Text>
                    </View>
                    <Text
                        className="font-body-semibold mb-2 text-[15px]"
                        style={{ color: colors.onSurface }}
                    >
                        {t("deleteAccount.intro")}
                    </Text>
                    <View className="gap-2">
                        {CONSEQUENCES.map((key) => (
                            <View key={key} className="flex-row gap-2">
                                <Text style={{ color: colors.onSurfaceVariant }}>
                                    •
                                </Text>
                                <Text
                                    className="font-body flex-1 text-[14px] leading-[21px]"
                                    style={{ color: colors.onSurfaceVariant }}
                                >
                                    {t(key)}
                                </Text>
                            </View>
                        ))}
                    </View>
                </View>

                <Text
                    nativeID="delete-account-password-label"
                    className="mb-2 ml-1 mt-6 text-[14px] font-body-semibold"
                    style={{ color: colors.onSurface }}
                >
                    {t("deleteAccount.passwordLabel")}
                </Text>
                <View
                    className="h-12 flex-row items-center rounded-xl border px-3"
                    style={{
                        backgroundColor: colors.surface,
                        borderColor: error ? colors.error : colors.outlineVariant,
                    }}
                >
                    <TextInput
                        accessibilityLabelledBy="delete-account-password-label"
                        value={password}
                        onChangeText={(value) => {
                            setPassword(value);
                            if (error) setError(null);
                        }}
                        placeholder={t("deleteAccount.passwordPlaceholder")}
                        placeholderTextColor={colors.outline}
                        secureTextEntry={!isPasswordVisible}
                        autoCapitalize="none"
                        autoComplete="current-password"
                        textContentType="password"
                        editable={!isDeleting}
                        returnKeyType="done"
                        onSubmitEditing={() => void handleDelete()}
                        className="font-body h-full flex-1 text-[15px]"
                        style={{ color: colors.onSurface }}
                    />
                    <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={
                            isPasswordVisible
                                ? t("deleteAccount.hidePassword")
                                : t("deleteAccount.showPassword")
                        }
                        onPress={() => setIsPasswordVisible((value) => !value)}
                        hitSlop={8}
                        className="h-10 w-10 items-center justify-center"
                    >
                        {isPasswordVisible ? (
                            <EyeOff size={20} color={colors.outline} />
                        ) : (
                            <Eye size={20} color={colors.outline} />
                        )}
                    </Pressable>
                </View>
                {error && (
                    <Text
                        accessibilityLiveRegion="polite"
                        className="font-body ml-1 mt-2 text-[13px]"
                        style={{ color: colors.error }}
                    >
                        {error}
                    </Text>
                )}

                {/* A opção segura fica em destaque; a destrutiva, abaixo. */}
                <View className="mt-8 gap-3">
                    <Pressable
                        accessibilityRole="button"
                        onPress={() => router.back()}
                        disabled={isDeleting}
                        className="h-12 items-center justify-center rounded-xl"
                        style={{ backgroundColor: colors.primary }}
                    >
                        <Text className="text-[15px] font-body-bold text-white">
                            {t("deleteAccount.keep")}
                        </Text>
                    </Pressable>
                    <Pressable
                        accessibilityRole="button"
                        accessibilityState={{ busy: isDeleting }}
                        onPress={() => void handleDelete()}
                        disabled={isDeleting}
                        className="h-12 items-center justify-center rounded-xl border"
                        style={({ pressed }) => ({
                            borderColor: colors.errorBorder,
                            backgroundColor: pressed
                                ? colors.errorContainer
                                : colors.surface,
                        })}
                    >
                        {isDeleting ? (
                            <ActivityIndicator size="small" color={colors.error} />
                        ) : (
                            <Text
                                className="text-[15px] font-body-bold"
                                style={{ color: colors.error }}
                            >
                                {t("deleteAccount.confirm")}
                            </Text>
                        )}
                    </Pressable>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}
