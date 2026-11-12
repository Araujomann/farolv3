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

// ==========================================
// VALIDAÇÃO
// ==========================================

const loginSchema = z.object({
    email: z.email({
        message: "E-mail inválido",
    }),
    password: z.string().min(8, {
        message: "A senha deve ter ao menos 8 caracteres",
    }),
});

type LoginFormData = z.infer<typeof loginSchema>;

// ==========================================
// TELA DE LOGIN
// ==========================================

export default function LoginScreen() {
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
        } catch (error: any) {
            const message =
                error?.response?.data?.message ??
                error?.response?.data?.errors?.[0]?.message ??
                "E-mail ou senha incorretos.";

            setServerError(message);
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
                backgroundColor: "#FFFFFF",
            }}
        >
            <View style={{ flex: 1 }}>
                <View style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
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
                            <Box className="flex-1 w-full bg-white px-7">
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
                                accessibilityLabel="Ícone do Farol"
                            />

                            <Text className="text-xl font-bold tracking-tight text-slate-900">
                                Farol
                            </Text>
                        </Box>

                        {/* ==================================
                CONTEÚDO CENTRAL
            ================================== */}

                        <Box className="flex-1 justify-center py-6">
                            {/* TÍTULO */}

                            <VStack space="xs" className="mb-9 items-center">
                                <Text className="text-center text-2xl font-bold tracking-tight text-slate-900">
                                    Bem-vindo!
                                </Text>

                                <Text className="text-center text-lg font-bold tracking-tight text-slate-800">
                                    Entre para continuar
                                </Text>
                            </VStack>

                            {/* FORMULÁRIO */}

                            <VStack space="lg">
                                {/* ==============================
                    E-MAIL
                ============================== */}

                                <VStack space="xs">
                                    <Box className="relative">
                                        <Text className="absolute -top-2 left-3.5 z-10 bg-white px-1.5 text-xs font-medium text-slate-500">
                                            E-mail
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
                                                    className="h-12 rounded-xl border-slate-300 bg-white px-3 dark:bg-white"
                                                >
                                                    <InputSlot className="pl-0">
                                                        <InputIcon
                                                            as={Mail}
                                                            className="text-slate-400"
                                                        />
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
                                                        className="text-sm font-medium text-slate-800"
                                                        accessibilityLabel="E-mail"
                                                    />
                                                </Input>
                                            )}
                                        />
                                    </Box>

                                    {errors.email && (
                                        <Text className="text-xs text-red-600">
                                            {errors.email.message}
                                        </Text>
                                    )}
                                </VStack>

                                {/* ==============================
                    SENHA
                ============================== */}

                                <VStack space="xs">
                                    <Box className="relative">
                                        <Text className="absolute -top-2 left-3.5 z-10 bg-white px-1.5 text-xs font-medium text-slate-500">
                                            Senha
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
                                                    className="h-12 rounded-xl border-slate-300 bg-white px-3 dark:bg-white"
                                                >
                                                    <InputSlot className="pl-0">
                                                        <InputIcon
                                                            as={Lock}
                                                            className="text-slate-400"
                                                        />
                                                    </InputSlot>

                                                    <InputField
                                                        placeholder="••••••••"
                                                        placeholderTextColor="#94a3b8"
                                                        secureTextEntry={
                                                            !showPassword
                                                        }
                                                        onBlur={onBlur}
                                                        onChangeText={onChange}
                                                        value={value}
                                                        className="text-sm font-medium text-slate-800"
                                                        accessibilityLabel="Senha"
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
                                                                ? "Ocultar senha"
                                                                : "Mostrar senha"
                                                        }
                                                    >
                                                        <InputIcon
                                                            as={
                                                                showPassword
                                                                    ? Eye
                                                                    : EyeOff
                                                            }
                                                            className="text-slate-400"
                                                        />
                                                    </InputSlot>
                                                </Input>
                                            )}
                                        />
                                    </Box>

                                    {errors.password && (
                                        <Text className="text-xs text-red-600">
                                            {errors.password.message}
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
                                                    : "#CBD5E1",
                                                backgroundColor: rememberMe
                                                    ? "#007AFF"
                                                    : "#FFFFFF",
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

                                        <Text className="text-xs font-medium text-slate-500">
                                            Lembrar de mim
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
                                        <Text className="text-xs font-medium text-[#0058BC]">
                                        Esqueceu a senha?
                                        </Text>
                                    </TouchableOpacity>
                                </Box>

                                {/* ==============================
                    ERRO DO SERVIDOR
                ============================== */}

                                {serverError && (
                                    <Box className="rounded-xl bg-red-50 px-4 py-3">
                                        <Text className="text-sm text-red-700">
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
                                        <ButtonText className="text-sm font-medium text-white">
                                            Entrar
                                        </ButtonText>
                                    )}
                                </Button>
                            </VStack>
                        </Box>

                            </Box>
                        </ScrollView>
                    </KeyboardAvoidingView>

                    <Box className="w-full flex-row items-center justify-center gap-1 bg-white px-7 pb-5 pt-6">
                        <Text className="text-center text-sm text-slate-600">
                            Não tem uma conta?
                        </Text>

                        <TouchableOpacity
                            onPress={() => router.push("/(auth)/register")}
                            activeOpacity={0.7}
                            accessibilityRole="button"
                        >
                            <Text className="text-sm font-bold text-slate-900">
                                Cadastre-se
                            </Text>
                        </TouchableOpacity>
                    </Box>
                </View>
            </View>
        </SafeAreaView>
    );
}
