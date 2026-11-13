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
import { useLocalSearchParams, useRouter } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { isAxiosError } from "axios";
import { z } from "zod";
import { ChevronLeft, Eye, EyeOff, Lock } from "lucide-react-native";

import { Text } from "@/components/ui/text";
import { Input, InputField, InputIcon, InputSlot } from "@/components/ui/input";
import { Button, ButtonSpinner, ButtonText } from "@/components/ui/button";
import { VStack } from "@/components/ui/vstack";
import { Box } from "@/components/ui/box";
import { resetPasswordService } from "@/src/api/auth";
import { useAuthStore } from "@/src/store/authStore";

const resetSchema = z
    .object({
        password: z.string().min(8, { message: "A senha deve ter ao menos 8 caracteres" }).max(128),
        confirmPassword: z.string().min(1, { message: "Confirme sua senha" }),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "As senhas não coincidem",
        path: ["confirmPassword"],
    });

type ResetFormData = z.infer<typeof resetSchema>;

function getErrorMessage(error: unknown) {
    if (isAxiosError<{ error?: { message?: string } }>(error)) {
        return error.response?.data?.error?.message ??
            "Não foi possível redefinir a senha. Solicite um novo código e tente novamente.";
    }

    return "Não foi possível redefinir a senha. Solicite um novo código e tente novamente.";
}

export default function ResetPasswordScreen() {
    const router = useRouter();
    const { authorizationToken } = useLocalSearchParams<{
        authorizationToken?: string;
    }>();
    const signOut = useAuthStore((state) => state.signOut);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [serverError, setServerError] = useState<string | null>(null);
    const [isReset, setIsReset] = useState(false);
    const validToken =
        typeof authorizationToken === "string" &&
        /^[a-f0-9]{64}$/.test(authorizationToken);

    const {
        control,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<ResetFormData>({
        resolver: zodResolver(resetSchema),
        defaultValues: { password: "", confirmPassword: "" },
    });

    const onSubmit = async ({ password }: ResetFormData) => {
        if (!validToken) return;
        setServerError(null);

        try {
            await resetPasswordService({ authorizationToken, newPassword: password });
            await signOut();
            setIsReset(true);
        } catch (error) {
            setServerError(getErrorMessage(error));
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
                                        {isReset ? "Senha redefinida" : "Crie uma nova senha"}
                                    </Text>
                                    <Text className="font-body text-center text-sm text-slate-500">
                                        {isReset
                                            ? "Sua senha foi atualizada. Entre novamente com a nova senha."
                                            : "Escolha uma senha com pelo menos 8 caracteres."}
                                    </Text>
                                </VStack>

                                {isReset ? (
                                    <Button
                                        className="h-12 rounded-xl bg-[#0058BC]"
                                        onPress={() => router.replace("/(auth)/login")}
                                    >
                                        <ButtonText className="text-sm font-body-medium text-white">
                                            Ir para entrar
                                        </ButtonText>
                                    </Button>
                                ) : !validToken ? (
                                    <VStack space="lg">
                                        <Box className="rounded-xl bg-red-50 px-4 py-3">
                                            <Text className="font-body text-sm text-red-700">
                                                A autorização de redefinição é inválida ou expirou. Solicite outro código.
                                            </Text>
                                        </Box>
                                        <Button
                                            className="h-12 rounded-xl bg-[#0058BC]"
                                            onPress={() => router.replace("/(auth)/forgot-password")}
                                        >
                                            <ButtonText className="text-sm font-body-medium text-white">
                                                Solicitar outro link
                                            </ButtonText>
                                        </Button>
                                    </VStack>
                                ) : (
                                    <VStack space="lg">
                                        {(
                                            [
                                                {
                                                    name: "password",
                                                    label: "Nova senha",
                                                    visible: showPassword,
                                                    toggle: () => setShowPassword((value) => !value),
                                                    error: errors.password,
                                                },
                                                {
                                                    name: "confirmPassword",
                                                    label: "Confirme a nova senha",
                                                    visible: showConfirmPassword,
                                                    toggle: () => setShowConfirmPassword((value) => !value),
                                                    error: errors.confirmPassword,
                                                },
                                            ] as const
                                        ).map((field) => (
                                            <VStack space="xs" key={field.name}>
                                                <Box className="relative">
                                                    <Text className="absolute -top-2 left-3.5 z-10 bg-white px-1.5 text-xs font-body-medium text-slate-500">
                                                        {field.label}
                                                    </Text>
                                                    <Controller
                                                        control={control}
                                                        name={field.name}
                                                        render={({ field: { onChange, onBlur, value } }) => (
                                                            <Input
                                                                isInvalid={!!field.error}
                                                                className="h-12 rounded-xl border-slate-300 bg-white px-3 dark:bg-white"
                                                            >
                                                                <InputSlot className="pl-0">
                                                                    <InputIcon as={Lock} className="text-slate-400" />
                                                                </InputSlot>
                                                                <InputField
                                                                    placeholder="••••••••"
                                                                    placeholderTextColor="#94a3b8"
                                                                    secureTextEntry={!field.visible}
                                                                    autoComplete="new-password"
                                                                    onBlur={onBlur}
                                                                    onChangeText={onChange}
                                                                    value={value}
                                                                    className="text-sm font-body-medium text-slate-800"
                                                                    accessibilityLabel={field.label}
                                                                />
                                                                <InputSlot
                                                                    className="pr-0"
                                                                    onPress={field.toggle}
                                                                    accessibilityLabel={
                                                                        field.visible ? "Ocultar senha" : "Mostrar senha"
                                                                    }
                                                                >
                                                                    <InputIcon
                                                                        as={field.visible ? Eye : EyeOff}
                                                                        className="text-slate-400"
                                                                    />
                                                                </InputSlot>
                                                            </Input>
                                                        )}
                                                    />
                                                </Box>
                                                {field.error && (
                                                    <Text className="font-body text-xs text-red-600">
                                                        {field.error.message}
                                                    </Text>
                                                )}
                                            </VStack>
                                        ))}

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
                                                    Salvar nova senha
                                                </ButtonText>
                                            )}
                                        </Button>
                                    </VStack>
                                )}
                            </Box>
                        </Box>
                    </ScrollView>
                </KeyboardAvoidingView>

                {!isReset && (
                    <Box className="w-full flex-row items-center justify-center bg-white px-7 pb-5 pt-4">
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
                )}
            </View>
        </SafeAreaView>
    );
}
