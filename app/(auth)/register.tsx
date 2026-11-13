
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, Lock, User } from "lucide-react-native";

import { Text } from "@/components/ui/text";
import {
  Button,
  ButtonText,
  ButtonSpinner,
} from "@/components/ui/button";
import { VStack } from "@/components/ui/vstack";
import { Box } from "@/components/ui/box";

import { registerService } from "@/src/api/auth";
import { useAuthStore } from "@/src/store/authStore";
import { AuthServerError } from "@/src/features/auth/components/AuthServerError";
import { AuthTextField } from "@/src/features/auth/components/AuthTextField";
import { RegisterHeader } from "@/src/features/auth/components/RegisterHeader";
import { TermsCheckbox } from "@/src/features/auth/components/TermsCheckbox";

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
        <RegisterHeader onBack={() => router.back()} />

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

              {/* FORMULÁRIO */}

              <VStack space="md">
                <Controller
                  control={control}
                  name="name"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <AuthTextField
                      label={t("auth.register.fullName")}
                      labelVariant="compact"
                      icon={User}
                      error={errors.name}
                      placeholder={t("auth.register.namePlaceholder")}
                      autoCapitalize="words"
                      autoCorrect={false}
                      autoComplete="name"
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                      accessibilityLabel={t("auth.register.fullNameLabel")}
                    />
                  )}
                />

                <Controller
                  control={control}
                  name="email"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <AuthTextField
                      label={t("auth.email")}
                      labelVariant="compact"
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

                <Controller
                  control={control}
                  name="password"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <AuthTextField
                      label={t("auth.password")}
                      labelVariant="compact"
                      icon={Lock}
                      error={errors.password}
                      placeholder="••••••••"
                      secureTextEntry={!showPassword}
                      autoComplete="new-password"
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                      accessibilityLabel={t("auth.password")}
                      passwordVisibility={{
                        isVisible: showPassword,
                        onToggle: () =>
                          setShowPassword((previous) => !previous),
                      }}
                    />
                  )}
                />

                <Controller
                  control={control}
                  name="confirmPassword"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <AuthTextField
                      label={t("auth.register.confirmPassword")}
                      labelVariant="compact"
                      icon={Lock}
                      error={errors.confirmPassword}
                      placeholder="••••••••"
                      secureTextEntry={!showConfirmPassword}
                      autoComplete="new-password"
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                      accessibilityLabel={t("auth.register.confirmPasswordLabel")}
                      passwordVisibility={{
                        isVisible: showConfirmPassword,
                        onToggle: () =>
                          setShowConfirmPassword((previous) => !previous),
                      }}
                    />
                  )}
                />

                {/* TERMOS DE USO */}

                <Controller
                  control={control}
                  name="acceptedTerms"
                  render={({ field: { value, onChange } }) => (
                    <TermsCheckbox value={value} onChange={onChange} />
                  )}
                />

                {errors.acceptedTerms && (
                  <Text className="font-body text-xs text-red-600 dark:text-[#FF7B70]">
                    {t(errors.acceptedTerms.message as TranslationKey)}
                  </Text>
                )}

                {serverError && <AuthServerError message={serverError} />}

                {/* BOTÃO CADASTRAR (mesmo padrão do login) */}

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
// ESTILOS DA TELA
// ==========================================

const createStyles = (colors: AppColors) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.surface,
  },

  screen: {
    flex: 1,
  },

  panel: {
    flex: 1,
    backgroundColor: colors.surface,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    overflow: "hidden",
  },
});
