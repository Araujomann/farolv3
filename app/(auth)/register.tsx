import React, { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Mail, Lock, User } from "lucide-react-native";

import { Text } from "@/components/ui/text";
import { Input, InputField, InputSlot, InputIcon } from "@/components/ui/input";
import { Button, ButtonText, ButtonSpinner } from "@/components/ui/button";
import { Box } from "@/components/ui/box";

import { registerService } from "@/src/api/auth";
import { useAuthStore } from "@/src/store/authStore";

const registerSchema = z.object({
    name: z.string().min(2, { message: "O nome deve ter ao menos 2 caracteres" }).max(120),
    email: z.email({ message: "E-mail inválido" }),
    password: z.string().min(8, { message: "A senha deve ter ao menos 8 caracteres" }).max(128),
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterScreen() {
    const router = useRouter();
    const signIn = useAuthStore((state) => state.signIn);
    const [showPassword, setShowPassword] = useState(false);
    const [serverError, setServerError] = useState<string | null>(null);

    const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterFormData>({
        resolver: zodResolver(registerSchema),
        defaultValues: { name: "", email: "", password: "" },
    });

    const onSubmit = async (data: RegisterFormData) => {
        setServerError(null);
        try {
            const { tokens, user } = await registerService(data);
            await signIn(user, tokens.accessToken, tokens.refreshToken);
        } catch (error: any) {
            const message =
                error?.response?.data?.message ??
                error?.response?.data?.errors?.[0]?.message ??
                "Não foi possível criar a conta. Tente novamente.";
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
                        <Text className="text-3xl font-bold text-foreground">Criar conta</Text>
                        <Text className="text-muted-foreground">Preencha os campos para se cadastrar</Text>
                    </VStack>

                    <VStack space="md">
                        {/* Nome */}
                        <VStack space="xs">
                            <Text className="text-sm font-medium text-foreground">Nome</Text>
                            <Controller
                                control={control}
                                name="name"
                                render={({ field: { onChange, onBlur, value } }) => (
                                    <Input isInvalid={!!errors.name}>
                                        <InputSlot className="pl-3">
                                            <InputIcon as={User} />
                                        </InputSlot>
                                        <InputField
                                            placeholder="Seu nome completo"
                                            autoCapitalize="words"
                                            autoCorrect={false}
                                            onBlur={onBlur}
                                            onChangeText={onChange}
                                            value={value}
                                        />
                                    </Input>
                                )}
                            />
                            {errors.name && (
                                <Text className="text-xs text-destructive">{errors.name.message}</Text>
                            )}
                        </VStack>

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
                                : <ButtonText>Criar conta</ButtonText>
                            }
                        </Button>
                    </VStack>

                    <Box className="mt-8 flex-row items-center justify-center gap-1">
                        <Text className="text-sm text-muted-foreground">Já tem uma conta?</Text>
                        <TouchableOpacity onPress={() => router.back()}>
                            <Text className="text-sm font-semibold text-primary">Entrar</Text>
                        </TouchableOpacity>
                    </Box>

                </Box>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

