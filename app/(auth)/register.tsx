
import React, { useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  Pressable,
  StatusBar,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  Check,
  ChevronLeft,
} from "lucide-react-native";

import { Text } from "@/components/ui/text";
import {
  Input,
  InputField,
  InputSlot,
  InputIcon,
} from "@/components/ui/input";
import {
  Button,
  ButtonText,
  ButtonSpinner,
} from "@/components/ui/button";
import { VStack } from "@/components/ui/vstack";
import { Box } from "@/components/ui/box";

import { registerService } from "@/src/api/auth";
import { useAuthStore } from "@/src/store/authStore";

// ==========================================
// VALIDAÇÃO
// ==========================================

const registerSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, {
        message: "O nome deve ter ao menos 2 caracteres",
      })
      .max(120),

    email: z.email({
      message: "E-mail inválido",
    }),

    password: z
      .string()
      .min(8, {
        message: "A senha deve ter ao menos 8 caracteres",
      })
      .max(128),

    confirmPassword: z.string().min(1, {
      message: "Confirme sua senha",
    }),

    acceptedTerms: z.boolean().refine(
      (value) => value,
      {
        message: "Você precisa aceitar os termos.",
      }
    ),
  })
  .refine(
    (data) => data.password === data.confirmPassword,
    {
      message: "As senhas não coincidem",
      path: ["confirmPassword"],
    }
  );

type RegisterFormData = z.infer<typeof registerSchema>;

// ==========================================
// TELA DE CADASTRO
// ==========================================

export default function RegisterScreen() {
  const router = useRouter();

  const signIn = useAuthStore(
    (state) => state.signIn
  );

  const [showPassword, setShowPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [serverError, setServerError] =
    useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: {
      errors,
      isSubmitting,
    },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      acceptedTerms: false,
    },
  });

  // ==========================================
  // AUTENTICAÇÃO ORIGINAL PRESERVADA
  // ==========================================

  const onSubmit = async (
    data: RegisterFormData
  ) => {
    setServerError(null);

    try {
      const { tokens, user } =
        await registerService({
          name: data.name,
          email: data.email,
          password: data.password,
        });

      await signIn(
        user,
        tokens.accessToken,
        tokens.refreshToken
      );

      // Redireciona para a tela de lembrete de verificação
      router.replace("/(auth)/verify-reminder");
    } catch (error: any) {
      const message =
        error?.response?.data?.error?.message ??
        "Falha ao criar a conta. Tente novamente.";

      setServerError(message);
    }
  };

  // ==========================================
  // INTERFACE
  // ==========================================

  return (
    <SafeAreaView
      edges={["top", "bottom"]}
      style={styles.safeArea}
    >
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#EEF2F6"
      />

      <View style={styles.screen}>
        {/* ==================================
            CABEÇALHO
        ================================== */}

        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            activeOpacity={0.7}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel="Voltar"
          >
            <ChevronLeft
              size={20}
              color="#475569"
              strokeWidth={2}
            />
          </TouchableOpacity>

          <View
            style={styles.brandContainer}
            pointerEvents="none"
          >
            <Image
              source={require(
                "../../assets/images/app-icon.png"
              )}
              style={styles.brandIcon}
              resizeMode="contain"
              accessibilityLabel="Ícone do Farol"
            />

            <Text style={styles.brandName}>
              Farol
            </Text>
          </View>
        </View>

        {/* ==================================
            PAINEL PRINCIPAL
        ================================== */}

        <View style={styles.panel}>
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={
              Platform.OS === "ios"
                ? "padding"
                : "height"
            }
          >
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{
                flexGrow: 1,
              }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              bounces={false}
            >
              <Box className="flex-1 w-full bg-white px-7">

            {/* ==================================
                CONTEÚDO CENTRAL
            ================================== */}

            <Box className="flex-1 justify-center py-8">

              {/* TÍTULO */}

              <VStack
                space="xs"
                className="mb-9 items-center"
              >
                <Text className="text-center text-2xl font-bold tracking-tight text-slate-900">
                  Criar uma conta
                </Text>

                <Text className="text-center text-xs font-medium text-slate-500">
                  Preencha seus dados para começar a navegar com segurança
                </Text>
              </VStack>

              {/* ==================================
                  FORMULÁRIO
              ================================== */}

              <VStack space="md">

                {/* ==============================
                    NOME COMPLETO
                ============================== */}

                <VStack space="xs">
                  <Box className="relative">

                    <Text className="absolute -top-2 left-3 z-10 bg-white px-1 text-xs font-medium text-slate-500">
                      Nome Completo
                    </Text>

                    <Controller
                      control={control}
                      name="name"
                      render={({
                        field: {
                          onChange,
                          onBlur,
                          value,
                        },
                      }) => (
                        <Input
                          isInvalid={!!errors.name}
                          className="h-12 rounded-xl border-slate-300 bg-white px-3 dark:bg-white"
                        >
                          <InputSlot className="pl-0">
                            <InputIcon
                              as={User}
                              className="text-slate-400"
                            />
                          </InputSlot>

                          <InputField
                            placeholder="Ex: Lucas Santana"
                            placeholderTextColor="#94a3b8"
                            autoCapitalize="words"
                            autoCorrect={false}
                            autoComplete="name"
                            onBlur={onBlur}
                            onChangeText={onChange}
                            value={value}
                            className="text-sm font-medium text-slate-800"
                            accessibilityLabel="Nome completo"
                          />
                        </Input>
                      )}
                    />
                  </Box>

                  {errors.name && (
                    <Text className="text-xs text-red-600">
                      {errors.name.message}
                    </Text>
                  )}
                </VStack>

                {/* ==============================
                    E-MAIL
                ============================== */}

                <VStack space="xs">
                  <Box className="relative">

                    <Text className="absolute -top-2 left-3 z-10 bg-white px-1 text-xs font-medium text-slate-500">
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

                    <Text className="absolute -top-2 left-3 z-10 bg-white px-1 text-xs font-medium text-slate-500">
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
                          isInvalid={!!errors.password}
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
                            secureTextEntry={!showPassword}
                            autoComplete="new-password"
                            onBlur={onBlur}
                            onChangeText={onChange}
                            value={value}
                            className="text-sm font-medium text-slate-800"
                            accessibilityLabel="Senha"
                          />

                          <InputSlot
                            className="pr-0"
                            onPress={() =>
                              setShowPassword(
                                (previous) => !previous
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
                    CONFIRMAR SENHA
                ============================== */}

                <VStack space="xs">
                  <Box className="relative">

                    <Text className="absolute -top-2 left-3 z-10 bg-white px-1 text-xs font-medium text-slate-500">
                      Confirmar Senha
                    </Text>

                    <Controller
                      control={control}
                      name="confirmPassword"
                      render={({
                        field: {
                          onChange,
                          onBlur,
                          value,
                        },
                      }) => (
                        <Input
                          isInvalid={
                            !!errors.confirmPassword
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
                              !showConfirmPassword
                            }
                            autoComplete="new-password"
                            onBlur={onBlur}
                            onChangeText={onChange}
                            value={value}
                            className="text-sm font-medium text-slate-800"
                            accessibilityLabel="Confirmar senha"
                          />

                          <InputSlot
                            className="pr-0"
                            onPress={() =>
                              setShowConfirmPassword(
                                (previous) => !previous
                              )
                            }
                            accessibilityLabel={
                              showConfirmPassword
                                ? "Ocultar senha"
                                : "Mostrar senha"
                            }
                          >
                            <InputIcon
                              as={
                                showConfirmPassword
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

                  {errors.confirmPassword && (
                    <Text className="text-xs text-red-600">
                      {errors.confirmPassword.message}
                    </Text>
                  )}
                </VStack>

                {/* ==============================
                    TERMOS DE USO
                ============================== */}

                <Controller
                  control={control}
                  name="acceptedTerms"
                  render={({
                    field: {
                      value,
                      onChange,
                    },
                  }) => (
                    <Pressable
                      onPress={() => onChange(!value)}
                      className="flex-row items-center gap-2 pt-1"
                      accessibilityRole="checkbox"
                      accessibilityState={{
                        checked: value,
                      }}
                    >
                      <View
                        style={[
                          styles.checkbox,
                          value && styles.checkboxChecked,
                        ]}
                      >
                        {value && (
                          <Check
                            size={12}
                            color="#FFFFFF"
                            strokeWidth={2.5}
                          />
                        )}
                      </View>

                      <Text className="flex-1 text-xs font-medium text-slate-500">
                        Concordo com os{" "}
                        <Text className="text-xs font-semibold text-[#0058BC]">
                          Termos de Uso
                        </Text>
                        {" "}e{" "}
                        <Text className="text-xs font-semibold text-[#0058BC]">
                          Privacidade
                        </Text>
                      </Text>
                    </Pressable>
                  )}
                />

                {errors.acceptedTerms && (
                  <Text className="text-xs text-red-600">
                    {errors.acceptedTerms.message}
                  </Text>
                )}

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
                    BOTÃO CADASTRAR
                    PADRÃO DO LOGIN
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
                      Cadastrar
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
              Já tem uma conta?
            </Text>

            <TouchableOpacity
              onPress={() => router.back()}
              activeOpacity={0.7}
              accessibilityRole="button"
            >
              <Text className="text-sm font-bold text-slate-900">
                Entrar
              </Text>
            </TouchableOpacity>
          </Box>
        </View>
      </View>
    </SafeAreaView>
  );
}

// ==========================================
// ESTILOS DO CABEÇALHO
// ==========================================

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  screen: {
    flex: 1,
  },

  header: {
    height: 60,
    backgroundColor: "#EEF2F6",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    position: "relative",
  },

  backButton: {
    width: 32,
    height: 32,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },

  brandContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },

  brandIcon: {
    width: 28,
    height: 28,
  },

  brandName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#17243A",
  },

  panel: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    overflow: "hidden",
  },

  checkbox: {
    width: 16,
    height: 16,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },

  checkboxChecked: {
    backgroundColor: "#0058BC",
    borderColor: "#0058BC",
  },
});
