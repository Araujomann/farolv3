import React, { useEffect, useState } from "react";
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { isAxiosError } from "axios";
import { z } from "zod";
import { ChevronLeft, KeyRound, Mail } from "lucide-react-native";

import { Text } from "@/components/ui/text";
import { Button, ButtonSpinner, ButtonText } from "@/components/ui/button";
import { VStack } from "@/components/ui/vstack";
import { Box } from "@/components/ui/box";
import {
    requestPasswordResetService,
    verifyPasswordResetCodeService,
} from "@/src/api/auth";
import { AuthBrand } from "@/src/features/auth/components/AuthBrand";
import { AuthServerError } from "@/src/features/auth/components/AuthServerError";
import {
    AuthTextField,
    CODE_INPUT_CLASS_NAME,
} from "@/src/features/auth/components/AuthTextField";

import { useAppTheme } from "@/src/theme/useAppTheme";
import { useTranslation, type TranslationKey } from "@/src/i18n";
const requestSchema = z.object({
    email: z.email({ message: "auth.validation.invalidEmail" }),
});

type RequestFormData = z.infer<typeof requestSchema>;

const codeSchema = z.object({
    code: z.string().regex(/^\d{6}$/, "auth.codeLength"),
});

type CodeFormData = z.infer<typeof codeSchema>;

const SEND_ERROR: TranslationKey = "auth.forgot.sendError";

export default function ForgotPasswordScreen() {
    const { colors } = useAppTheme();
    const { t } = useTranslation();
    const router = useRouter();
    const [serverError, setServerError] = useState<string | null>(null);
    const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);
    const [stage, setStage] = useState<"email" | "code">("email");
    const [resendCooldown, setResendCooldown] = useState(0);
    const [isResending, setIsResending] = useState(false);

    const {
        control,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<RequestFormData>({
        resolver: zodResolver(requestSchema),
        defaultValues: { email: "" },
    });

    const {
        control: codeControl,
        handleSubmit: handleCodeSubmit,
        reset: resetCodeForm,
        formState: { errors: codeErrors, isSubmitting: isVerifying },
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

    const onSubmit = async ({ email }: RequestFormData) => {
        setServerError(null);

        try {
            await requestPasswordResetService(email.trim());
            setSubmittedEmail(email.trim());
            setStage("code");
            setResendCooldown(60);
        } catch {
            setServerError(t(SEND_ERROR));
        }
    };

    const onVerifyCode = async ({ code }: CodeFormData) => {
        if (!submittedEmail) return;
        setServerError(null);

        try {
            const authorizationToken = await verifyPasswordResetCodeService({
                email: submittedEmail,
                code,
            });
            router.replace({
                pathname: "/(auth)/reset-password",
                params: { authorizationToken },
            });
        } catch (error) {
            setServerError(
                isAxiosError(error) && error.response?.status === 400
                    ? t("auth.forgot.invalidCode")
                    : t(SEND_ERROR),
            );
        }
    };

    const onResendCode = async () => {
        if (!submittedEmail || resendCooldown > 0 || isResending) return;
        setServerError(null);
        setIsResending(true);

        try {
            await requestPasswordResetService(submittedEmail);
            resetCodeForm({ code: "" });
            setResendCooldown(60);
        } catch {
            setServerError(t(SEND_ERROR));
        } finally {
            setIsResending(false);
        }
    };

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
                            <AuthBrand />

                            <Box className="flex-1 justify-center py-6">
                                <VStack space="xs" className="mb-9 items-center">
                                    <Text className="text-center text-2xl font-display tracking-tight text-slate-900 dark:text-[#ECEEF4]">
                                        {stage === "code" ? t("auth.forgot.codeTitle") : t("auth.forgot.title")}
                                    </Text>
                                    <Text className="font-body text-center text-sm text-slate-500 dark:text-[#8B92A1]">
                                        {stage === "code"
                                            ? t("auth.forgot.codeSubtitle", { email: submittedEmail ?? "" })
                                            : t("auth.forgot.subtitle")}
                                    </Text>
                                </VStack>

                                {stage === "code" ? (
                                    <VStack space="lg">
                                        <Box className="rounded-xl bg-blue-50 dark:bg-[#16253F] px-4 py-3">
                                            <Text className="font-body text-sm text-slate-700 dark:text-[#AAB0BD]">
                                                {t("auth.forgot.codeHint")}
                                            </Text>
                                        </Box>
                                        <Controller
                                            control={codeControl}
                                            name="code"
                                            render={({ field: { onChange, onBlur, value } }) => (
                                                <AuthTextField
                                                    label={t("auth.forgot.codeLabel")}
                                                    icon={KeyRound}
                                                    error={codeErrors.code}
                                                    inputClassName={CODE_INPUT_CLASS_NAME}
                                                    placeholder="000000"
                                                    keyboardType="number-pad"
                                                    maxLength={6}
                                                    autoComplete="one-time-code"
                                                    onBlur={onBlur}
                                                    onChangeText={(text) => onChange(text.replace(/\D/g, ""))}
                                                    value={value}
                                                    accessibilityLabel={t("auth.forgot.codeAccessibility")}
                                                />
                                            )}
                                        />

                                        {serverError && <AuthServerError message={serverError} />}

                                        <Button
                                            className="h-12 rounded-xl bg-[#0058BC]"
                                            onPress={handleCodeSubmit(onVerifyCode)}
                                            disabled={isVerifying}
                                        >
                                            {isVerifying ? (
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
                                            <Text className={`text-sm font-body-medium ${resendCooldown > 0 ? "text-slate-400 dark:text-[#8B92A1]" : "text-[#0058BC] dark:text-[#3B87F5]"}`}>
                                                {isResending
                                                    ? t("auth.sendingCode")
                                                    : resendCooldown > 0
                                                    ? t("auth.forgot.resendIn", { seconds: resendCooldown })
                                                    : t("auth.forgot.resend")}
                                            </Text>
                                        </TouchableOpacity>
                                    </VStack>
                                ) : (
                                    <VStack space="lg">
                                        <Controller
                                            control={control}
                                            name="email"
                                            render={({ field: { onChange, onBlur, value } }) => (
                                                <AuthTextField
                                                    label={t("auth.email")}
                                                    icon={Mail}
                                                    error={errors.email}
                                                    placeholder={t("auth.emailPlaceholder")}
                                                    keyboardType="email-address"
                                                    autoCapitalize="none"
                                                    autoCorrect={false}
                                                    autoComplete="email"
                                                    onBlur={onBlur}
                                                    onChangeText={onChange}
                                                    value={value}
                                                    accessibilityLabel={t("auth.email")}
                                                />
                                            )}
                                        />

                                        {serverError && <AuthServerError message={serverError} />}

                                        <Button
                                            className="h-12 rounded-xl bg-[#0058BC]"
                                            onPress={handleSubmit(onSubmit)}
                                            disabled={isSubmitting}
                                        >
                                            {isSubmitting ? (
                                                <ButtonSpinner className="text-white" />
                                            ) : (
                                                <ButtonText className="text-sm font-body-medium text-white">
                                                    {t("auth.forgot.submit")}
                                                </ButtonText>
                                            )}
                                        </Button>
                                    </VStack>
                                )}
                            </Box>
                        </Box>
                    </ScrollView>
                </KeyboardAvoidingView>

                <Box className="w-full flex-row items-center justify-center gap-1 bg-white dark:bg-[#1A1D24] px-7 pb-5 pt-4">
                    <TouchableOpacity
                        onPress={() => router.replace("/(auth)/login")}
                        activeOpacity={0.7}
                        accessibilityRole="button"
                        className="flex-row items-center gap-1"
                    >
                        <ChevronLeft size={16} color={colors.onSurfaceVariant} />
                        <Text className="text-sm font-body-bold text-slate-700 dark:text-[#AAB0BD]">{t("auth.backToLogin")}</Text>
                    </TouchableOpacity>
                </Box>
            </View>
        </SafeAreaView>
    );
}
