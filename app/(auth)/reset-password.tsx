import React, { useState } from "react";
import {
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
import { z } from "zod";
import { ChevronLeft, Lock } from "lucide-react-native";

import { Text } from "@/components/ui/text";
import { Button, ButtonSpinner, ButtonText } from "@/components/ui/button";
import { VStack } from "@/components/ui/vstack";
import { Box } from "@/components/ui/box";
import { resetPasswordService } from "@/src/api/auth";
import { useAuthStore } from "@/src/store/authStore";
import { AuthBrand } from "@/src/features/auth/components/AuthBrand";
import { AuthServerError } from "@/src/features/auth/components/AuthServerError";
import { AuthTextField } from "@/src/features/auth/components/AuthTextField";

import { useAppTheme } from "@/src/theme/useAppTheme";
import { useTranslation } from "@/src/i18n";
const resetSchema = z
    .object({
        password: z.string().min(8, { message: "auth.validation.passwordMin" }).max(128),
        confirmPassword: z.string().min(1, { message: "auth.validation.confirmPassword" }),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "auth.validation.passwordsMismatch",
        path: ["confirmPassword"],
    });

type ResetFormData = z.infer<typeof resetSchema>;


export default function ResetPasswordScreen() {
    const { colors } = useAppTheme();
    const { t } = useTranslation();
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
        } catch {
            setServerError(t("auth.reset.error"));
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
                                        {isReset ? t("auth.reset.doneTitle") : t("auth.reset.title")}
                                    </Text>
                                    <Text className="font-body text-center text-sm text-slate-500 dark:text-[#8B92A1]">
                                        {isReset
                                            ? t("auth.reset.doneSubtitle")
                                            : t("auth.reset.subtitle")}
                                    </Text>
                                </VStack>

                                {isReset ? (
                                    <Button
                                        className="h-12 rounded-xl bg-[#0058BC]"
                                        onPress={() => router.replace("/(auth)/login")}
                                    >
                                        <ButtonText className="text-sm font-body-medium text-white">
                                            {t("auth.reset.goToLogin")}
                                        </ButtonText>
                                    </Button>
                                ) : !validToken ? (
                                    <VStack space="lg">
                                        <Box className="rounded-xl bg-red-50 dark:bg-[#2C1715] px-4 py-3">
                                            <Text className="font-body text-sm text-red-700 dark:text-[#FF7B70]">
                                                {t("auth.reset.invalidAuthorization")}
                                            </Text>
                                        </Box>
                                        <Button
                                            className="h-12 rounded-xl bg-[#0058BC]"
                                            onPress={() => router.replace("/(auth)/forgot-password")}
                                        >
                                            <ButtonText className="text-sm font-body-medium text-white">
                                                {t("auth.reset.requestAgain")}
                                            </ButtonText>
                                        </Button>
                                    </VStack>
                                ) : (
                                    <VStack space="lg">
                                        {(
                                            [
                                                {
                                                    name: "password",
                                                    label: t("auth.reset.newPassword"),
                                                    visible: showPassword,
                                                    toggle: () => setShowPassword((value) => !value),
                                                    error: errors.password,
                                                },
                                                {
                                                    name: "confirmPassword",
                                                    label: t("auth.reset.confirmNewPassword"),
                                                    visible: showConfirmPassword,
                                                    toggle: () => setShowConfirmPassword((value) => !value),
                                                    error: errors.confirmPassword,
                                                },
                                            ] as const
                                        ).map((field) => (
                                            <Controller
                                                key={field.name}
                                                control={control}
                                                name={field.name}
                                                render={({ field: { onChange, onBlur, value } }) => (
                                                    <AuthTextField
                                                        label={field.label}
                                                        icon={Lock}
                                                        error={field.error}
                                                        placeholder="••••••••"
                                                        secureTextEntry={!field.visible}
                                                        autoComplete="new-password"
                                                        onBlur={onBlur}
                                                        onChangeText={onChange}
                                                        value={value}
                                                        accessibilityLabel={field.label}
                                                        passwordVisibility={{
                                                            isVisible: field.visible,
                                                            onToggle: field.toggle,
                                                        }}
                                                    />
                                                )}
                                            />
                                        ))}

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
                                                    {t("auth.reset.submit")}
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
                    <Box className="w-full flex-row items-center justify-center bg-white dark:bg-[#1A1D24] px-7 pb-5 pt-4">
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
                )}
            </View>
        </SafeAreaView>
    );
}
