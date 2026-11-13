import React, { useEffect, useRef, useState } from "react";
import {
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { isAxiosError } from "axios";
import { z } from "zod";
import { CircleCheck, KeyRound, LogOut } from "lucide-react-native";

import { Text } from "@/components/ui/text";
import { Input, InputField, InputIcon, InputSlot } from "@/components/ui/input";
import { Button, ButtonSpinner, ButtonText } from "@/components/ui/button";
import { VStack } from "@/components/ui/vstack";
import { Box } from "@/components/ui/box";
import { useAuthStore } from "@/src/store/authStore";
import {
    getMeService,
    resendVerificationCodeService,
    verifyEmailCodeService,
} from "@/src/api/auth";

import { useAppTheme } from "@/src/theme/useAppTheme";
import { useTranslation, type TranslationKey } from "@/src/i18n";
const RESEND_COOLDOWN_SECONDS = 60;

const codeSchema = z.object({
    code: z.string().regex(/^\d{6}$/, "auth.codeLength"),
});

type CodeFormData = z.infer<typeof codeSchema>;

type ApiError = { error?: { message?: string; code?: string } };

function getErrorMessage(error: unknown) {
    return isAxiosError<ApiError>(error)
        ? (error.response?.data?.error?.message ?? "")
        : "";
}

function getErrorCode(error: unknown) {
    return isAxiosError<ApiError>(error)
        ? error.response?.data?.error?.code
        : undefined;
}

// A API responde "Aguarde 42s para solicitar um novo código." no cooldown.
function getCooldownFromError(error: unknown) {
    const match = /(\d+)s/.exec(getErrorMessage(error));
    return match ? Number(match[1]) : RESEND_COOLDOWN_SECONDS;
}

/**
 * Tela de verificação de e-mail por código de 6 dígitos.
 *
 * Params:
 * - send=1 → pede um novo código ao abrir (login ou acesso pelo app).
 *   Sem ele, assume que o código acabou de ser enviado (cadastro).
 * - from=app → aberta de dentro do app; "Verificar depois" volta para a tela anterior.
 */
export default function VerifyEmailScreen() {
    const { colors } = useAppTheme();
    const { t } = useTranslation();
    const router = useRouter();
    const params = useLocalSearchParams<{ send?: string; from?: string }>();
    const user = useAuthStore((state) => state.user);
    const setUser = useAuthStore((state) => state.setUser);
    const signOut = useAuthStore((state) => state.signOut);
    const dismissPrompt = useAuthStore(
        (state) => state.dismissEmailVerificationPrompt,
    );

    const shouldSendOnOpen = params.send === "1";
    const openedFromApp = params.from === "app";

    const [serverError, setServerError] = useState<string | null>(null);
    const [infoMessage, setInfoMessage] = useState<string | null>(null);
    const [resendCooldown, setResendCooldown] = useState(
        shouldSendOnOpen ? 0 : RESEND_COOLDOWN_SECONDS,
    );
    const [isResending, setIsResending] = useState(false);
    const [isVerified, setIsVerified] = useState(false);
    const autoSendStarted = useRef(false);

    const {
        control,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<CodeFormData>({
        resolver: zodResolver(codeSchema),
        defaultValues: { code: "" },
    });

    useEffect(() => {
        if (resendCooldown <= 0) return;

        const timer = setTimeout(
            () => setResendCooldown((remaining) => remaining - 1),
            1000,
        );
        return () => clearTimeout(timer);
    }, [resendCooldown]);

    const goToApp = () => {
        if (openedFromApp && router.canGoBack()) {
            router.back();
        } else {
            router.replace("/(tabs)/home");
        }
    };

    const sendCode = async ({ silentCooldown }: { silentCooldown: boolean }) => {
        setServerError(null);
        setInfoMessage(null);
        setIsResending(true);

        try {
            const { retryAfterSeconds } = await resendVerificationCodeService();
            reset({ code: "" });
            setResendCooldown(retryAfterSeconds);
            setInfoMessage(t("auth.verify.newCodeSent"));
        } catch (error) {
            const code = getErrorCode(error);

            if (code === "AUTH_VERIFICATION_CODE_COOLDOWN") {
                const seconds = getCooldownFromError(error);
                setResendCooldown(seconds);
                if (!silentCooldown) {
                    setServerError(t("auth.verify.cooldown", { seconds }));
                }
            } else if (code === "AUTH_EMAIL_ALREADY_VERIFIED") {
                const updatedUser = await getMeService().catch(() => null);
                if (updatedUser) {
                    setUser(updatedUser);
                    setIsVerified(true);
                }
            } else {
                setServerError(t("auth.verify.sendError"));
            }
        } finally {
            setIsResending(false);
        }
    };

    // Login / acesso pelo app: envia um código novo ao abrir a tela.
    // Se um código foi enviado há menos de 1 minuto, apenas respeita o cooldown.
    useEffect(() => {
        if (!shouldSendOnOpen || autoSendStarted.current || !user) return;
        if (user.is_email_verified) return;

        autoSendStarted.current = true;
        void sendCode({ silentCooldown: true });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [shouldSendOnOpen, user?.id]);

    // Após verificar, mostra a confirmação e entra no app
    useEffect(() => {
        if (!isVerified) return;

        const timer = setTimeout(() => {
            dismissPrompt();
            goToApp();
        }, 1800);
        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isVerified]);

    const onVerifyCode = async ({ code }: CodeFormData) => {
        setServerError(null);
        setInfoMessage(null);

        try {
            const updatedUser = await verifyEmailCodeService(code);
            setUser(updatedUser);
            setIsVerified(true);
        } catch (error) {
            const errorCode = getErrorCode(error);
            setServerError(
                errorCode === "AUTH_INVALID_VERIFICATION_CODE"
                    ? t("auth.verify.invalidCode")
                    : t("auth.verify.verifyError"),
            );
        }
    };

    const onResendCode = () => {
        if (resendCooldown > 0 || isResending) return;
        void sendCode({ silentCooldown: false });
    };

    const onVerifyLater = () => {
        dismissPrompt();
        goToApp();
    };

    if (!user) {
        return null;
    }

    if (isVerified || user.is_email_verified) {
        return (
            <SafeAreaView
                edges={["top", "bottom"]}
                style={{ flex: 1, backgroundColor: colors.surface }}
            >
                <View className="flex-1 items-center justify-center px-8">
                    <View className="mb-6 h-24 w-24 items-center justify-center rounded-full bg-green-50 dark:bg-[#12271B]">
                        <CircleCheck size={56} color={colors.success} strokeWidth={2} />
                    </View>
                    <Text className="mb-2 text-center text-2xl font-display tracking-tight text-slate-900 dark:text-[#ECEEF4]">
                        {t("auth.verify.verifiedTitle")}
                    </Text>
                    <Text className="font-body text-center text-sm leading-5 text-slate-500 dark:text-[#8B92A1]">
                        {t("auth.verify.verifiedMessage")}
                    </Text>
                    {!isVerified && (
                        <Button
                            className="mt-8 h-12 w-full rounded-xl bg-[#0058BC]"
                            onPress={onVerifyLater}
                        >
                            <ButtonText className="text-sm font-body-medium text-white">
                                {t("auth.verify.continue")}
                            </ButtonText>
                        </Button>
                    )}
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView edges={["top", "bottom"]} style={{ flex: 1, backgroundColor: colors.surface }}>
            <View style={{ flex: 1 }}>
                <KeyboardAvoidingView
                    style={{ flex: 1 }}
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    enabled={Platform.OS === "ios"}
                >
                    <ScrollView
                        contentContainerStyle={{ flexGrow: 1 }}
                        keyboardShouldPersistTaps="handled"
                        showsVerticalScrollIndicator={false}
                    >
                        <Box className="flex-1 w-full bg-white dark:bg-[#1A1D24] px-7">
                            <Box className="w-full flex-row items-center justify-center gap-1.5 pt-4 pb-2">
                                <Image
                                    source={require("../../assets/images/app-icon.png")}
                                    resizeMode="contain"
                                    style={{ width: 36, height: 36 }}
                                    accessibilityLabel={t("auth.logoLabel")}
                                />
                                <Text className="text-xl font-display tracking-tight text-slate-900 dark:text-[#ECEEF4]">
                                    Farol
                                </Text>
                            </Box>

                            <Box className="flex-1 justify-center py-6">
                                <VStack space="xs" className="mb-9 items-center">
                                    <Text className="text-center text-2xl font-display tracking-tight text-slate-900 dark:text-[#ECEEF4]">
                                        {t("auth.verify.title")}
                                    </Text>
                                    <Text className="font-body text-center text-sm text-slate-500 dark:text-[#8B92A1]">
                                        {t("auth.verify.sentTo")}{" "}
                                        <Text className="text-sm font-body-semibold text-slate-700 dark:text-[#AAB0BD]">
                                            {user.email}
                                        </Text>
                                        {t("auth.verify.sentToSuffix")}
                                    </Text>
                                </VStack>

                                <VStack space="lg">
                                    <Box className="rounded-xl bg-blue-50 dark:bg-[#16253F] px-4 py-3">
                                        <Text className="font-body text-sm text-slate-700 dark:text-[#AAB0BD]">
                                            {t("auth.verify.hint")}
                                        </Text>
                                    </Box>

                                    <VStack space="xs">
                                        <Box className="relative">
                                            <Text className="absolute -top-2 left-3.5 z-10 bg-white dark:bg-[#1A1D24] px-1.5 text-xs font-body-medium text-slate-500 dark:text-[#8B92A1]">
                                                {t("auth.verify.codeLabel")}
                                            </Text>
                                            <Controller
                                                control={control}
                                                name="code"
                                                render={({ field: { onChange, onBlur, value } }) => (
                                                    <Input
                                                        isInvalid={!!errors.code}
                                                        className="h-12 rounded-xl border-slate-300 dark:border-[#3A3F4B] bg-white dark:bg-[#1A1D24] px-3 dark:bg-[#1A1D24]"
                                                    >
                                                        <InputSlot className="pl-0">
                                                            <InputIcon as={KeyRound} className="text-slate-400 dark:text-[#8B92A1]" />
                                                        </InputSlot>
                                                        <InputField
                                                            placeholder="000000"
                                                            placeholderTextColor={colors.outline}
                                                            keyboardType="number-pad"
                                                            maxLength={6}
                                                            autoComplete="one-time-code"
                                                            textContentType="oneTimeCode"
                                                            onBlur={onBlur}
                                                            onChangeText={(text) => onChange(text.replace(/\D/g, ""))}
                                                            onSubmitEditing={handleSubmit(onVerifyCode)}
                                                            value={value}
                                                            className="text-sm font-body-medium tracking-[4px] text-slate-800 dark:text-[#ECEEF4]"
                                                            accessibilityLabel={t("auth.verify.codeAccessibility")}
                                                        />
                                                    </Input>
                                                )}
                                            />
                                        </Box>
                                        {errors.code && (
                                            <Text className="font-body text-xs text-red-600 dark:text-[#FF7B70]">
                                                {t(errors.code.message as TranslationKey)}
                                            </Text>
                                        )}
                                    </VStack>

                                    {infoMessage && !serverError && (
                                        <Box className="rounded-xl bg-green-50 dark:bg-[#12271B] px-4 py-3">
                                            <Text className="font-body text-sm text-green-700 dark:text-[#5BD48A]">{infoMessage}</Text>
                                        </Box>
                                    )}

                                    {serverError && (
                                        <Box className="rounded-xl bg-red-50 dark:bg-[#2C1715] px-4 py-3">
                                            <Text className="font-body text-sm text-red-700 dark:text-[#FF7B70]">{serverError}</Text>
                                        </Box>
                                    )}

                                    <Button
                                        className="h-12 rounded-xl bg-[#0058BC]"
                                        onPress={handleSubmit(onVerifyCode)}
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? (
                                            <ButtonSpinner className="text-white" />
                                        ) : (
                                            <ButtonText className="text-sm font-body-medium text-white">
                                                {t("auth.confirmCode")}
                                            </ButtonText>
                                        )}
                                    </Button>

                                    <TouchableOpacity
                                        onPress={onResendCode}
                                        disabled={resendCooldown > 0 || isResending}
                                        activeOpacity={0.7}
                                        accessibilityRole="button"
                                        className="items-center py-2"
                                    >
                                        <Text className={`text-sm font-body-medium ${resendCooldown > 0 || isResending ? "text-slate-400 dark:text-[#8B92A1]" : "text-[#0058BC] dark:text-[#3B87F5]"}`}>
                                            {isResending
                                                ? t("auth.sendingCode")
                                                : resendCooldown > 0
                                                ? t("auth.verify.resendIn", { seconds: resendCooldown })
                                                : t("auth.verify.resend")}
                                        </Text>
                                    </TouchableOpacity>
                                </VStack>
                            </Box>
                        </Box>
                    </ScrollView>
                </KeyboardAvoidingView>

                <Box className="w-full items-center gap-3 bg-white dark:bg-[#1A1D24] px-7 pb-5 pt-4">
                    <TouchableOpacity
                        onPress={onVerifyLater}
                        activeOpacity={0.7}
                        accessibilityRole="button"
                        className="items-center"
                    >
                        <Text className="text-sm font-body-bold text-slate-700 dark:text-[#AAB0BD]">{t("auth.verify.later")}</Text>
                        <Text className="mt-0.5 text-center text-xs text-slate-500 dark:text-[#8B92A1]">
                            {t("auth.verify.laterHint")}
                        </Text>
                    </TouchableOpacity>
                    {!openedFromApp && (
                        <TouchableOpacity
                            onPress={() => void signOut()}
                            activeOpacity={0.7}
                            accessibilityRole="button"
                            className="flex-row items-center gap-1"
                        >
                            <LogOut size={14} color={colors.outline} />
                            <Text className="text-xs text-slate-400 dark:text-[#8B92A1]">{t("auth.verify.otherAccount")}</Text>
                        </TouchableOpacity>
                    )}
                </Box>
            </View>
        </SafeAreaView>
    );
}
