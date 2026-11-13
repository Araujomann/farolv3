
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

import { useAppTheme } from "@/src/theme/useAppTheme";
import { useTranslation, type TranslationKey } from "@/src/i18n";
import { type AppColors } from "@/src/theme/colors";
// ==========================================
// VALIDAÇÃO
// ==========================================

const registerSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, {
        message: "auth.validation.nameMin",
      })
      .max(120),

    email: z.email({
      message: "auth.validation.invalidEmail",
    }),

    password: z
      .string()
      .min(8, {
        message: "auth.validation.passwordMin",
      })
      .max(128),

    confirmPassword: z.string().min(1, {
      message: "auth.validation.confirmPassword",
    }),

    acceptedTerms: z.boolean().refine(
      (value) => value,
      {
        message: "auth.validation.acceptTerms",
      }
    ),
  })
  .refine(
    (data) => data.password === data.confirmPassword,
    {
      message: "auth.validation.passwordsMismatch",
      path: ["confirmPassword"],
    }
  );

type RegisterFormData = z.infer<typeof registerSchema>;

// ==========================================
// TELA DE CADASTRO
// ==========================================

export default function RegisterScreen() {
  const styles = createStyles(useAppTheme().colors);
  const { colors, isDark } = useAppTheme();
  const { t } = useTranslation();
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

      // O _layout.tsx redireciona para a tela do código de verificação
      // (o código já foi enviado pela API no cadastro).
      await signIn(
        user,
        tokens.accessToken,
        tokens.refreshToken,
        "register"
      );
    } catch (error: any) {
      setServerError(
        error?.response?.data?.error?.code === "AUTH_EMAIL_ALREADY_IN_USE"
          ? t("auth.register.emailInUse")
          : t("auth.register.genericError")
      );
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
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={colors.surfaceMuted}
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
            accessibilityLabel={t("common.back")}
          >
            <ChevronLeft
              size={20}
              color={colors.onSurfaceVariant}
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
              accessibilityLabel={t("auth.logoLabel")}
            />

            <Text className="font-body" style={styles.brandName}>
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
              <Box className="flex-1 w-full bg-white dark:bg-[#1A1D24] px-7">

            {/* ==================================
                CONTEÚDO CENTRAL
            ================================== */}

            <Box className="flex-1 justify-center py-8">

              {/* TÍTULO */}

              <VStack
                space="xs"
                className="mb-9 items-center"
              >
                <Text className="text-center text-2xl font-display tracking-tight text-slate-900 dark:text-[#ECEEF4]">
                  {t("auth.register.title")}
                </Text>

                <Text className="text-center text-xs font-body-medium text-slate-500 dark:text-[#8B92A1]">
                  {t("auth.register.subtitle")}
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

                    <Text className="absolute -top-2 left-3 z-10 bg-white dark:bg-[#1A1D24] px-1 text-xs font-body-medium text-slate-500 dark:text-[#8B92A1]">
                      {t("auth.register.fullName")}
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
                          className="h-12 rounded-xl border-slate-300 dark:border-[#3A3F4B] bg-white dark:bg-[#1A1D24] px-3 dark:bg-[#1A1D24]"
                        >
                          <InputSlot className="pl-0">
                            <InputIcon
                              as={User}
                              className="text-slate-400 dark:text-[#8B92A1]"
                            />
                          </InputSlot>

                          <InputField
                            placeholder={t("auth.register.namePlaceholder")}
                            placeholderTextColor={colors.outline}
                            autoCapitalize="words"
                            autoCorrect={false}
                            autoComplete="name"
                            onBlur={onBlur}
                            onChangeText={onChange}
                            value={value}
                            className="text-sm font-body-medium text-slate-800 dark:text-[#ECEEF4]"
                            accessibilityLabel={t("auth.register.fullNameLabel")}
                          />
                        </Input>
                      )}
                    />
                  </Box>

                  {errors.name && (
                    <Text className="font-body text-xs text-red-600 dark:text-[#FF7B70]">
                      {t(errors.name.message as TranslationKey)}
                    </Text>
                  )}
                </VStack>

                {/* ==============================
                    E-MAIL
                ============================== */}

                <VStack space="xs">
                  <Box className="relative">

                    <Text className="absolute -top-2 left-3 z-10 bg-white dark:bg-[#1A1D24] px-1 text-xs font-body-medium text-slate-500 dark:text-[#8B92A1]">
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

                    <Text className="absolute -top-2 left-3 z-10 bg-white dark:bg-[#1A1D24] px-1 text-xs font-body-medium text-slate-500 dark:text-[#8B92A1]">
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
                          isInvalid={!!errors.password}
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
                            secureTextEntry={!showPassword}
                            autoComplete="new-password"
                            onBlur={onBlur}
                            onChangeText={onChange}
                            value={value}
                            className="text-sm font-body-medium text-slate-800 dark:text-[#ECEEF4]"
                            accessibilityLabel={t("auth.password")}
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
                    CONFIRMAR SENHA
                ============================== */}

                <VStack space="xs">
                  <Box className="relative">

                    <Text className="absolute -top-2 left-3 z-10 bg-white dark:bg-[#1A1D24] px-1 text-xs font-body-medium text-slate-500 dark:text-[#8B92A1]">
                      {t("auth.register.confirmPassword")}
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
                              !showConfirmPassword
                            }
                            autoComplete="new-password"
                            onBlur={onBlur}
                            onChangeText={onChange}
                            value={value}
                            className="text-sm font-body-medium text-slate-800 dark:text-[#ECEEF4]"
                            accessibilityLabel={t("auth.register.confirmPasswordLabel")}
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
                                ? t("auth.hidePassword")
                                : t("auth.showPassword")
                            }
                          >
                            <InputIcon
                              as={
                                showConfirmPassword
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

                  {errors.confirmPassword && (
                    <Text className="font-body text-xs text-red-600 dark:text-[#FF7B70]">
                      {t(errors.confirmPassword.message as TranslationKey)}
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

                      <Text className="flex-1 text-xs font-body-medium text-slate-500 dark:text-[#8B92A1]">
                        {t("auth.register.agreePrefix")}{" "}
                        <Text className="text-xs font-body-semibold text-[#0058BC] dark:text-[#3B87F5]">
                          {t("auth.register.terms")}
                        </Text>
                        {" "}{t("auth.register.and")}{" "}
                        <Text className="text-xs font-body-semibold text-[#0058BC] dark:text-[#3B87F5]">
                          {t("auth.register.privacy")}
                        </Text>
                      </Text>
                    </Pressable>
                  )}
                />

                {errors.acceptedTerms && (
                  <Text className="font-body text-xs text-red-600 dark:text-[#FF7B70]">
                    {t(errors.acceptedTerms.message as TranslationKey)}
                  </Text>
                )}

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
                    <ButtonText className="text-sm font-body-medium text-white">
                      {t("auth.register.submit")}
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
              {t("auth.register.hasAccount")}
            </Text>

            <TouchableOpacity
              onPress={() => router.back()}
              activeOpacity={0.7}
              accessibilityRole="button"
            >
              <Text className="text-sm font-body-bold text-slate-900 dark:text-[#ECEEF4]">
                {t("auth.register.signIn")}
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

const createStyles = (colors: AppColors) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.surface,
  },

  screen: {
    flex: 1,
  },

  header: {
    height: 60,
    backgroundColor: colors.surfaceMuted,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    position: "relative",
  },

  backButton: {
    width: 32,
    height: 32,
    backgroundColor: colors.surface,
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
    fontFamily: "PlusJakartaSans_700Bold",
    color: colors.onSurface,
  },

  panel: {
    flex: 1,
    backgroundColor: colors.surface,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    overflow: "hidden",
  },

  checkbox: {
    width: 16,
    height: 16,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },

  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
});
