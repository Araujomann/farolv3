import React, { useEffect, useState } from "react";
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
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { isAxiosError } from "axios";
import { z } from "zod";
import { ChevronLeft, KeyRound, Mail } from "lucide-react-native";

import { Text } from "@/components/ui/text";
import { Input, InputField, InputIcon, InputSlot } from "@/components/ui/input";
import { Button, ButtonSpinner, ButtonText } from "@/components/ui/button";
import { VStack } from "@/components/ui/vstack";
import { Box } from "@/components/ui/box";
import {
    requestPasswordResetService,
    verifyPasswordResetCodeService,
} from "@/src/api/auth";

const requestSchema = z.object({
    email: z.email({ message: "E-mail inválido" }),
});

type RequestFormData = z.infer<typeof requestSchema>;

const codeSchema = z.object({
    code: z.string().regex(/^\d{6}$/, "Digite o código de 6 dígitos"),
});

type CodeFormData = z.infer<typeof codeSchema>;

function getErrorMessage(error: unknown) {
    if (isAxiosError<{ error?: { message?: string } }>(error)) {
        return error.response?.data?.error?.message ??
            "Não foi possível enviar o e-mail. Tente novamente.";
    }

    return "Não foi possível enviar o e-mail. Tente novamente.";
}

export default function ForgotPasswordScreen() {
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
        } catch (error) {
            setServerError(getErrorMessage(error));
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
                    ? "O código é inválido ou expirou. Confira os dígitos e tente novamente."
                    : getErrorMessage(error),
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
        } catch (error) {
            setServerError(getErrorMessage(error));
        } finally {
            setIsResending(false);
        }
    };

    return (
        <SafeAreaView edges={["top", "bottom"]} style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
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
                        <Box className="flex-1 w-full bg-white px-7">
                            <Box className="w-full flex-row items-center justify-center gap-1.5 pt-4 pb-2">
                                <Image
                                    source={require("../../assets/images/app-icon.png")}
                                    resizeMode="contain"
                                    style={{ width: 36, height: 36 }}
                                    accessibilityLabel="Ícone do Farol"
                                />
                                <Text className="text-xl font-display tracking-tight text-slate-900">
                                    Farol
                                </Text>
                            </Box>

                            <Box className="flex-1 justify-center py-6">
                                <VStack space="xs" className="mb-9 items-center">
                                    <Text className="text-center text-2xl font-display tracking-tight text-slate-900">
                                        {stage === "code" ? "Digite o código" : "Recuperar senha"}
                                    </Text>
                                    <Text className="font-body text-center text-sm text-slate-500">
                                        {stage === "code"
                                            ? `Se houver uma conta associada a ${submittedEmail}, enviaremos um código para esse endereço.`
                                            : "Informe o e-mail da sua conta para receber um código de recuperação."}
                                    </Text>
                                </VStack>

                                {stage === "code" ? (
                                    <VStack space="lg">
                                        <Box className="rounded-xl bg-blue-50 px-4 py-3">
                                            <Text className="font-body text-sm text-slate-700">
                                                O código tem 6 dígitos e expira em 5 minutos. Confira também sua caixa de spam.
                                            </Text>
                                        </Box>
                                        <VStack space="xs">
                                            <Box className="relative">
                                                <Text className="absolute -top-2 left-3.5 z-10 bg-white px-1.5 text-xs font-body-medium text-slate-500">
                                                    Código de recuperação
                                                </Text>
                                                <Controller
                                                    control={codeControl}
                                                    name="code"
                                                    render={({ field: { onChange, onBlur, value } }) => (
                                                        <Input
                                                            isInvalid={!!codeErrors.code}
                                                            className="h-12 rounded-xl border-slate-300 bg-white px-3 dark:bg-white"
                                                        >
                                                            <InputSlot className="pl-0">
                                                                <InputIcon as={KeyRound} className="text-slate-400" />
                                                            </InputSlot>
                                                            <InputField
                                                                placeholder="000000"
                                                                placeholderTextColor="#94a3b8"
                                                                keyboardType="number-pad"
                                                                maxLength={6}
                                                                autoComplete="one-time-code"
                                                                onBlur={onBlur}
                                                                onChangeText={(text) => onChange(text.replace(/\D/g, ""))}
                                                                value={value}
                                                                className="text-sm font-body-medium tracking-[4px] text-slate-800"
                                                                accessibilityLabel="Código de recuperação de seis dígitos"
                                                            />
                                                        </Input>
                                                    )}
                                                />
                                            </Box>
                                            {codeErrors.code && (
                                                <Text className="font-body text-xs text-red-600">
                                                    {codeErrors.code.message}
                                                </Text>
                                            )}
                                        </VStack>

                                        {serverError && (
                                            <Box className="rounded-xl bg-red-50 px-4 py-3">
                                                <Text className="font-body text-sm text-red-700">{serverError}</Text>
                                            </Box>
                                        )}

                                        <Button
                                            className="h-12 rounded-xl bg-[#0058BC]"
                                            onPress={handleCodeSubmit(onVerifyCode)}
                                            disabled={isVerifying}
                                        >
                                            {isVerifying ? (
                                                <ButtonSpinner className="text-white" />
                                            ) : (
                                                <ButtonText className="text-sm font-body-medium text-white">
                                                    Confirmar código
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
                                            <Text className={`text-sm font-body-medium ${resendCooldown > 0 ? "text-slate-400" : "text-[#0058BC]"}`}>
                                                {isResending
                                                    ? "Enviando código..."
                                                    : resendCooldown > 0
                                                    ? `Enviar outro código em ${resendCooldown}s`
                                                    : "Enviar outro código"}
                                            </Text>
                                        </TouchableOpacity>
                                    </VStack>
                                ) : (
                                    <VStack space="lg">
                                        <VStack space="xs">
                                            <Box className="relative">
                                                <Text className="absolute -top-2 left-3.5 z-10 bg-white px-1.5 text-xs font-body-medium text-slate-500">
                                                    E-mail
                                                </Text>
                                                <Controller
                                                    control={control}
                                                    name="email"
                                                    render={({ field: { onChange, onBlur, value } }) => (
                                                        <Input
                                                            isInvalid={!!errors.email}
                                                            className="h-12 rounded-xl border-slate-300 bg-white px-3 dark:bg-white"
                                                        >
                                                            <InputSlot className="pl-0">
                                                                <InputIcon as={Mail} className="text-slate-400" />
                                                            </InputSlot>
                                                            <InputField
                                                                placeholder="Digite seu e-mail"
                                                                placeholderTextColor="#94a3b8"
                                                                keyboardType="email-address"
                                                                autoCapitalize="none"
                                                                autoCorrect={false}
                                                                autoComplete="email"
                                                                onBlur={onBlur}
                                                                onChangeText={onChange}
                                                                value={value}
                                                                className="text-sm font-body-medium text-slate-800"
                                                                accessibilityLabel="E-mail"
                                                            />
                                                        </Input>
                                                    )}
                                                />
                                            </Box>
                                            {errors.email && (
                                                <Text className="font-body text-xs text-red-600">
                                                    {errors.email.message}
                                                </Text>
                                            )}
                                        </VStack>

                                        {serverError && (
                                            <Box className="rounded-xl bg-red-50 px-4 py-3">
                                                <Text className="font-body text-sm text-red-700">{serverError}</Text>
                                            </Box>
                                        )}

                                        <Button
                                            className="h-12 rounded-xl bg-[#0058BC]"
                                            onPress={handleSubmit(onSubmit)}
                                            disabled={isSubmitting}
                                        >
                                            {isSubmitting ? (
                                                <ButtonSpinner className="text-white" />
                                            ) : (
                                                <ButtonText className="text-sm font-body-medium text-white">
                                                    Enviar código de recuperação
                                                </ButtonText>
                                            )}
                                        </Button>
                                    </VStack>
                                )}
                            </Box>
                        </Box>
                    </ScrollView>
                </KeyboardAvoidingView>

                <Box className="w-full flex-row items-center justify-center gap-1 bg-white px-7 pb-5 pt-4">
                    <TouchableOpacity
                        onPress={() => router.replace("/(auth)/login")}
                        activeOpacity={0.7}
                        accessibilityRole="button"
                        className="flex-row items-center gap-1"
                    >
                        <ChevronLeft size={16} color="#475569" />
                        <Text className="text-sm font-body-bold text-slate-700">Voltar para entrar</Text>
                    </TouchableOpacity>
                </Box>
            </View>
        </SafeAreaView>
    );
}
