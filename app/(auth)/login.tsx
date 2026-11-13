import React, { useState } from "react";
import {
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Mail, Lock, Check } from "lucide-react-native";

import { Text } from "@/components/ui/text";
import { Input, InputField, InputSlot, InputIcon } from "@/components/ui/input";
import { Button, ButtonText, ButtonSpinner } from "@/components/ui/button";
import { VStack } from "@/components/ui/vstack";
import { Box } from "@/components/ui/box";

import { loginService } from "@/src/api/auth";
import { useAuthStore } from "@/src/store/authStore";

import { useAppTheme } from "@/src/theme/useAppTheme";
import { useTranslation, type TranslationKey } from "@/src/i18n";
// ==========================================
// VALIDAÇÃO
// ==========================================

const loginSchema = z.object({
    email: z.email({
        message: "auth.validation.invalidEmail",
    }),
    password: z.string().min(8, {
        message: "auth.validation.passwordMin",
    }),
});

type LoginFormData = z.infer<typeof loginSchema>;

// ==========================================
// TELA DE LOGIN
// ==========================================

export default function LoginScreen() {
    const { colors } = useAppTheme();
    const { t } = useTranslation();
    const router = useRouter();

    const signIn = useAuthStore((state) => state.signIn);

    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [serverError, setServerError] = useState<string | null>(null);

    const {
        control,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    });

    // ==========================================
    // AUTENTICAÇÃO ORIGINAL PRESERVADA
    // ==========================================

    const onSubmit = async (data: LoginFormData) => {
        setServerError(null);

        try {
            const { tokens, user } = await loginService(data);

            await signIn(user, tokens.accessToken, tokens.refreshToken);
        } catch {
            setServerError(t("auth.login.invalidCredentials"));
        }
    };

    // ==========================================
    // INTERFACE
    // ==========================================

    return (
        <SafeAreaView
            edges={["top", "bottom"]}
            style={{
                flex: 1,
                backgroundColor: colors.surface,
            }}
        >
            <View style={{ flex: 1 }}>
                <View style={{ flex: 1, backgroundColor: colors.surface }}>
                    <KeyboardAvoidingView
                        style={{ flex: 1 }}
                        behavior={Platform.OS === "ios" ? "padding" : "height"}
                        enabled={Platform.OS === "ios"}
                    >
                        <ScrollView
                            contentContainerStyle={{
                                flexGrow: 1,
                            }}
                            keyboardShouldPersistTaps="handled"
                            showsVerticalScrollIndicator={false}
                            bounces={false}
                        >
                            <Box className="flex-1 w-full bg-white dark:bg-[#1A1D24] px-7">
                        {/* ==================================
                LOGOTIPO
            ================================== */}

                        <Box className="w-full flex-row items-center justify-center gap-1.5 pt-4 pb-2">
                            <Image
                                source={require("../../assets/images/app-icon.png")}
                                resizeMode="contain"
                                style={{
                                    width: 36,
                                    height: 36,
                                }}
                                accessibilityLabel={t("auth.logoLabel")}
                            />

                            <Text className="text-xl font-display tracking-tight text-slate-900 dark:text-[#ECEEF4]">
                                Farol
                            </Text>
                        </Box>

                        {/* ==================================
                CONTEÚDO CENTRAL
            ================================== */}

                        <Box className="flex-1 justify-center py-6">
                            {/* TÍTULO */}

                            <VStack space="xs" className="mb-9 items-center">
                                <Text className="text-center text-2xl font-display tracking-tight text-slate-900 dark:text-[#ECEEF4]">
                                    {t("auth.login.welcome")}
                                </Text>

                                <Text className="text-center text-lg font-body-bold tracking-tight text-slate-800 dark:text-[#ECEEF4]">
                                    {t("auth.login.subtitle")}
                                </Text>
                            </VStack>

                            {/* FORMULÁRIO */}

                            <VStack space="lg">
                                {/* ==============================
                    E-MAIL
                ============================== */}

                                <VStack space="xs">
                                    <Box className="relative">
                                        <Text className="absolute -top-2 left-3.5 z-10 bg-white dark:bg-[#1A1D24] px-1.5 text-xs font-body-medium text-slate-500 dark:text-[#8B92A1]">
                                            {t("auth.email")}
                                        </Text>

                                        <Controller
                                            control={control}
                                            name="email"
                                            render={({
                                                field: {
                                                    onChange,
                                                    onBlur,
                                                    value,
                                                },
                                            }) => (
                                                <Input
                                                    isInvalid={!!errors.email}
                                                    className="h-12 rounded-xl border-slate-300 dark:border-[#3A3F4B] bg-white dark:bg-[#1A1D24] px-3 dark:bg-[#1A1D24]"
                                                >
                                                    <InputSlot className="pl-0">
                                                        <InputIcon
                                                            as={Mail}
                                                            className="text-slate-400 dark:text-[#8B92A1]"
                                                        />
                                                    </InputSlot>

                                                    <InputField
                                                        placeholder={t("auth.emailPlaceholder")}
                                                        placeholderTextColor={colors.outline}
                                                        keyboardType="email-address"
                                                        autoCapitalize="none"
                                                        autoCorrect={false}
                                                        autoComplete="email"
                                                        onBlur={onBlur}
                                                        onChangeText={onChange}
                                                        value={value}
                                                        className="text-sm font-body-medium text-slate-800 dark:text-[#ECEEF4]"
                                                        accessibilityLabel={t("auth.email")}
                                                    />
                                                </Input>
                                            )}
                                        />
                                    </Box>

                                    {errors.email && (
                                        <Text className="font-body text-xs text-red-600 dark:text-[#FF7B70]">
                                            {t(errors.email.message as TranslationKey)}
                                        </Text>
                                    )}
                                </VStack>

                                {/* ==============================
                    SENHA
                ============================== */}

                                <VStack space="xs">
                                    <Box className="relative">
                                        <Text className="absolute -top-2 left-3.5 z-10 bg-white dark:bg-[#1A1D24] px-1.5 text-xs font-body-medium text-slate-500 dark:text-[#8B92A1]">
                                            {t("auth.password")}
                                        </Text>

                                        <Controller
                                            control={control}
                                            name="password"
                                            render={({
                                                field: {
                                                    onChange,
                                                    onBlur,
                                                    value,
                                                },
                                            }) => (
                                                <Input
                                                    isInvalid={
                                                        !!errors.password
                                                    }
                                                    className="h-12 rounded-xl border-slate-300 dark:border-[#3A3F4B] bg-white dark:bg-[#1A1D24] px-3 dark:bg-[#1A1D24]"
                                                >
                                                    <InputSlot className="pl-0">
                                                        <InputIcon
                                                            as={Lock}
                                                            className="text-slate-400 dark:text-[#8B92A1]"
                                                        />
                                                    </InputSlot>

                                                    <InputField
                                                        placeholder="••••••••"
                                                        placeholderTextColor={colors.outline}
                                                        secureTextEntry={
                                                            !showPassword
                                                        }
                                                        onBlur={onBlur}
                                                        onChangeText={onChange}
                                                        value={value}
                                                        className="text-sm font-body-medium text-slate-800 dark:text-[#ECEEF4]"
                                                        accessibilityLabel={t("auth.password")}
                                                    />

                                                    {/* MOSTRAR / OCULTAR SENHA */}

                                                    <InputSlot
                                                        className="pr-0"
                                                        onPress={() =>
                                                            setShowPassword(
                                                                (v) => !v,
                                                            )
                                                        }
                                                        accessibilityLabel={
                                                            showPassword
                                                                ? t("auth.hidePassword")
                                                                : t("auth.showPassword")
                                                        }
                                                    >
                                                        <InputIcon
                                                            as={
                                                                showPassword
                                                                    ? Eye
                                                                    : EyeOff
                                                            }
                                                            className="text-slate-400 dark:text-[#8B92A1]"
                                                        />
                                                    </InputSlot>
                                                </Input>
                                            )}
                                        />
                                    </Box>

                                    {errors.password && (
                                        <Text className="font-body text-xs text-red-600 dark:text-[#FF7B70]">
                                            {t(errors.password.message as TranslationKey)}
                                        </Text>
                                    )}
                                </VStack>

                                {/* ==============================
                    LEMBRAR / RECUPERAR SENHA
                ============================== */}

                                <Box className="flex-row items-center justify-between pt-1">
                                    {/* LEMBRAR DE MIM - ESTADO VISUAL */}

                                    <TouchableOpacity
                                        onPress={() =>
                                            setRememberMe((value) => !value)
                                        }
                                        activeOpacity={0.7}
                                        className="flex-row items-center gap-2"
                                        accessibilityRole="checkbox"
                                        accessibilityState={{
                                            checked: rememberMe,
                                        }}
                                    >
                                        <Box
                                            className="h-4 w-4 items-center justify-center rounded"
                                            style={{
                                                borderWidth: 1,
                                                borderColor: rememberMe
                                                    ? "#007AFF"
                                                    : colors.outlineVariant,
                                                backgroundColor: rememberMe
                                                    ? "#007AFF"
                                                    : colors.surface,
                                            }}
                                        >
                                            {rememberMe && (
                                                <Check
                                                    size={12}
                                                    color="#FFFFFF"
                                                    strokeWidth={3}
                                                />
                                            )}
                                        </Box>

                                        <Text className="text-xs font-body-medium text-slate-500 dark:text-[#8B92A1]">
                                            {t("auth.login.rememberMe")}
                                        </Text>
                                    </TouchableOpacity>

                                    {/* TEXTO DE RECUPERAÇÃO */}

                                    <TouchableOpacity
                                        onPress={() =>
                                            router.push(
                                                "/(auth)/forgot-password",
                                            )
                                        }
                                        activeOpacity={0.7}
                                        accessibilityRole="button"
                                    >
                                        <Text className="text-xs font-body-medium text-[#0058BC] dark:text-[#3B87F5]">
                                        {t("auth.login.forgotPassword")}
                                        </Text>
                                    </TouchableOpacity>
                                </Box>

                                {/* ==============================
                    ERRO DO SERVIDOR
                ============================== */}

                                {serverError && (
                                    <Box className="rounded-xl bg-red-50 dark:bg-[#2C1715] px-4 py-3">
                                        <Text className="font-body text-sm text-red-700 dark:text-[#FF7B70]">
                                            {serverError}
                                        </Text>
                                    </Box>
                                )}

                                {/* ==============================
                    BOTÃO ENTRAR
                ============================== */}

                                <Button
                                    className={`mt-2 h-12 rounded-xl active:bg-[#003F88] ${
                                        isSubmitting
                                            ? "bg-[#003F88]"
                                            : "bg-[#0058BC]"
                                    }`}
                                    onPress={handleSubmit(onSubmit)}
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? (
                                        <ButtonSpinner className="text-white" />
                                    ) : (
                                        <ButtonText className="text-sm font-body-medium text-white">
                                            {t("auth.login.submit")}
                                        </ButtonText>
                                    )}
                                </Button>
                            </VStack>
                        </Box>

                            </Box>
                        </ScrollView>
                    </KeyboardAvoidingView>

                    <Box className="w-full flex-row items-center justify-center gap-1 bg-white dark:bg-[#1A1D24] px-7 pb-5 pt-6">
                        <Text className="font-body text-center text-sm text-slate-600 dark:text-[#AAB0BD]">
                            {t("auth.login.noAccount")}
                        </Text>

                        <TouchableOpacity
                            onPress={() => router.push("/(auth)/register")}
                            activeOpacity={0.7}
                            accessibilityRole="button"
                        >
                            <Text className="text-sm font-body-bold text-slate-900 dark:text-[#ECEEF4]">
                                {t("auth.login.signUp")}
                            </Text>
                        </TouchableOpacity>
                    </Box>
                </View>
            </View>
        </SafeAreaView>
    );
}
