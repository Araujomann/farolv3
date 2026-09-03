import React, { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Mail, Lock } from "lucide-react-native";

import { Text } from "@/components/ui/text";
import { Input, InputField, InputSlot, InputIcon } from "@/components/ui/input";
import { Button, ButtonText, ButtonSpinner } from "@/components/ui/button";
import { VStack } from "@/components/ui/vstack";
import { Box } from "@/components/ui/box";

import { loginService } from "@/src/api/auth";
import { useAuthStore } from "@/src/store/authStore";

const loginSchema = z.object({
    email: z.email({ message: "E-mail inválido" }),
    password: z.string().min(8, { message: "A senha deve ter ao menos 8 caracteres" }),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginScreen() {
    const router = useRouter();
    const signIn = useAuthStore((state) => state.signIn);
    const [showPassword, setShowPassword] = useState(false);
    const [serverError, setServerError] = useState<string | null>(null);

    const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
        defaultValues: { email: "", password: "" },
    });

    const onSubmit = async (data: LoginFormData) => {
        setServerError(null);
        try {
            const { token, refresh_token, user } = await loginService(data);
            await signIn(user, token, refresh_token);
        } catch (error: any) {
            const message =
                error?.response?.data?.message ??
                error?.response?.data?.errors?.[0]?.message ??
                "E-mail ou senha incorretos.";
            setServerError(message);
        }
    };

    return (
        <KeyboardAvoidingView
            className="flex-1 bg-background"
            behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
            <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
                <Box className="flex-1 justify-center px-6 py-12">

                    <VStack space="xs" className="mb-10">
                        <Text className="text-3xl font-bold text-foreground">Bem-vindo</Text>
                        <Text className="text-muted-foreground">Entre na sua conta para continuar</Text>
                    </VStack>

                    <VStack space="md">
                        {/* E-mail */}
                        <VStack space="xs">
                            <Text className="text-sm font-medium text-foreground">E-mail</Text>
                            <Controller
                                control={control}
                                name="email"
                                render={({ field: { onChange, onBlur, value } }) => (
                                    <Input isInvalid={!!errors.email}>
                                        <InputSlot className="pl-3">
                                            <InputIcon as={Mail} />
                                        </InputSlot>
                                        <InputField
                                            placeholder="seu@email.com"
                                            keyboardType="email-address"
                                            autoCapitalize="none"
                                            autoCorrect={false}
                                            onBlur={onBlur}
                                            onChangeText={onChange}
                                            value={value}
                                        />
                                    </Input>
                                )}
                            />
                            {errors.email && (
                                <Text className="text-xs text-destructive">{errors.email.message}</Text>
                            )}
                        </VStack>

                        {/* Senha */}
                        <VStack space="xs">
                            <Text className="text-sm font-medium text-foreground">Senha</Text>
                            <Controller
                                control={control}
                                name="password"
                                render={({ field: { onChange, onBlur, value } }) => (
                                    <Input isInvalid={!!errors.password}>
                                        <InputSlot className="pl-3">
                                            <InputIcon as={Lock} />
                                        </InputSlot>
                                        <InputField
                                            placeholder="••••••••"
                                            secureTextEntry={!showPassword}
                                            onBlur={onBlur}
                                            onChangeText={onChange}
                                            value={value}
                                        />
                                        <InputSlot className="pr-3" onPress={() => setShowPassword((v) => !v)}>
                                            <InputIcon as={showPassword ? Eye : EyeOff} />
                                        </InputSlot>
                                    </Input>
                                )}
                            />
                            {errors.password && (
                                <Text className="text-xs text-destructive">{errors.password.message}</Text>
                            )}
                        </VStack>

                        {serverError && (
                            <Box className="rounded-md bg-destructive/10 px-4 py-3">
                                <Text className="text-sm text-destructive">{serverError}</Text>
                            </Box>
                        )}

                        <Button className="mt-2 h-12" onPress={handleSubmit(onSubmit)} disabled={isSubmitting}>
                            {isSubmitting
                                ? <ButtonSpinner className="text-primary-foreground" />
                                : <ButtonText>Entrar</ButtonText>
                            }
                        </Button>
                    </VStack>

                    <Box className="mt-8 flex-row items-center justify-center gap-1">
                        <Text className="text-sm text-muted-foreground">Não tem uma conta?</Text>
                        <TouchableOpacity onPress={() => router.push("/(auth)/register")}>
                            <Text className="text-sm font-semibold text-primary">Cadastre-se</Text>
                        </TouchableOpacity>
                    </Box>

                </Box>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

