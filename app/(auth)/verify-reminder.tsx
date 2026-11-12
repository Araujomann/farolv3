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
import { useRouter, useLocalSearchParams } from "expo-router";
import { Mail, Check, AlertCircle, RefreshCw, Send } from "lucide-react-native";

import { Text } from "@/components/ui/text";
import {
    Button,
    ButtonText,
} from "@/components/ui/button";
import { VStack } from "@/components/ui/vstack";
import { Box } from "@/components/ui/box";

import { useAuthStore } from "@/src/store/authStore";
import { resendVerificationEmailService } from "@/src/api/auth";

export default function VerifyReminderScreen() {
    const router = useRouter();
    const user = useAuthStore((state) => state.user);
    const params = useLocalSearchParams<{ email?: string }>();
    
    const [serverError, setServerError] = useState<string | null>(null);
    const [isResending, setIsResending] = useState(false);
    const [sentMessage, setSentMessage] = useState(false);
    const [sentEmail, setSentEmail] = useState<string>("");
    
    const userEmail = user?.email || params.email || "";

    const handleResendEmail = async () => {
        const emailToSend = userEmail || sentEmail;
        if (!emailToSend) return;
        
        setServerError(null);
        setSentMessage(false);
        setIsResending(true);
        
        try {
            await resendVerificationEmailService(emailToSend);
            setSentMessage(true);
            setSentEmail(emailToSend);
            setTimeout(() => setSentMessage(false), 5000);
        } catch (error: any) {
            const message =
                error?.response?.data?.error?.message ??
                "Não foi possível reenviar o e-mail. Tente novamente.";
            setServerError(message);
        } finally {
            setIsResending(false);
        }
    };

    const handleVerifyNow = () => {
        router.push("/(auth)/verify-confirmation");
    };

    const handleGoHome = () => {
        router.replace("/(tabs)/home");
    };

    if (!user) {
        return null;
    }

    return (
        <SafeAreaView
            edges={["top", "bottom"]}
            style={{ flex: 1, backgroundColor: "#FFFFFF" }}
        >
            <View style={{ flex: 1 }}>
                <KeyboardAvoidingView
                    style={{ flex: 1 }}
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    enabled={Platform.OS === "ios"}
                >
                    <ScrollView
                        contentContainerStyle={{ flexGrow: 1 }}
                        keyboardShouldPersistTaps="handled"
                    >
                        <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 40 }}>
                            <View style={{ alignItems: "center", marginBottom: 32 }}>
                                <Text
                                    style={{ fontSize: 24, fontWeight: "700", color: "#181C23" }}
                                >
                                    Farol
                                </Text>
                            </View>

                            <Box className="rounded-2xl bg-amber-50 p-5 mb-6">
                                <View className="flex-row items-start gap-3">
                                    <AlertCircle size={24} color="#F59E0B" strokeWidth={2} />
                                    <Text className="flex-1 text-sm text-amber-800">
                                        Sua conta foi criada com sucesso! Para ter acesso completo ao 
                                        aplicativo e poder fazer relatos, é necessário verificar seu 
                                        endereço de e-mail.
                                    </Text>
                                </View>
                            </Box>

                            <Text className="text-lg font-semibold text-gray-900 mb-4">
                                Como verificar
                            </Text>

                            <View className="gap-4 mb-6">
                                <Box className="flex-row items-center gap-3 p-4 rounded-xl bg-gray-50">
                                    <Mail size={20} color="#0058BC" strokeWidth={2.2} />
                                    <View>
                                        <Text className="text-sm font-medium text-gray-900">
                                            Enviamos um e-mail para:
                                        </Text>
                                        <Text className="text-sm text-gray-600">
                                            {userEmail || "seu e-mail"}
                                        </Text>
                                    </View>
                                </Box>
                                <Box className="flex-row items-center gap-3 p-4 rounded-xl bg-gray-50">
                                    <Check size={20} color="#0058BC" strokeWidth={2.2} />
                                    <Text className="text-sm text-gray-600 flex-1">
                                        Abra o e-mail e clique no botão "Verificar e-mail"
                                    </Text>
                                </Box>
                                <Box className="flex-row items-center gap-3 p-4 rounded-xl bg-gray-50">
                                    <RefreshCw size={20} color="#0058BC" strokeWidth={2.2} />
                                    <Text className="text-sm text-gray-600 flex-1">
                                        Após verificar, retorne ao aplicativo
                                    </Text>
                                </Box>
                            </View>

                            {sentMessage ? (
                                <Box className="mb-4 rounded-xl bg-green-50 p-3">
                                    <Text className="text-sm text-green-700">
                                        E-mail reenviado com sucesso! Cheque sua caixa de entrada.
                                    </Text>
                                </Box>
                            ) : null}

                            {serverError ? (
                                <Box className="rounded-xl bg-red-50 px-4 py-3 mb-4">
                                    <Text className="text-sm text-red-700">
                                        {serverError}
                                    </Text>
                                </Box>
                            ) : null}

                            <Button
                                className="flex-row items-center justify-center gap-2 h-12 rounded-xl mb-3"
                                onPress={handleResendEmail}
                                disabled={isResending}
                            >
                                <Send size={18} color="#0058BC" strokeWidth={2.2} />
                                <ButtonText className="text-sm font-medium text-[#0058BC]">
                                    Reenviar e-mail de verificação
                                </ButtonText>
                            </Button>

                            <VStack className="gap-3">
                                <Button
                                    className="h-12 rounded-xl bg-[#0058BC]"
                                    onPress={handleVerifyNow}
                                >
                                    <ButtonText className="text-sm font-medium text-white">
                                        Verificar agora
                                    </ButtonText>
                                </Button>
                            </VStack>

                            <TouchableOpacity
                                onPress={handleGoHome}
                                activeOpacity={0.7}
                                className="mt-6 items-center"
                            >
                                <Text className="text-sm text-gray-500">
                                    Por enquanto, posso continuar sem verificação
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </View>
        </SafeAreaView>
    );
}
