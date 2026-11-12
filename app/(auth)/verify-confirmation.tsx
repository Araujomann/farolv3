import React, { useState, useEffect, useCallback, useRef } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity, View, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect, useLocalSearchParams } from 'expo-router';
import * as Linking from 'expo-linking';
import { ChevronLeft, Mail, Send, RefreshCw, Check, AlertCircle } from 'lucide-react-native';
import { Text } from '@/components/ui/text';
import { Input, InputField } from '@/components/ui/input';
import { Button, ButtonText } from '@/components/ui/button';
import { Box } from '@/components/ui/box';
import { useAuthStore } from '@/src/store/authStore';
import { verifyEmailService, resendVerificationEmailService, getMeService } from '@/src/api/auth';

// Color constants for the verify confirmation screen
const BACKGROUND_COLOR = '#FFFFFF';
const SUCCESS_COLOR = '#168047';
const WARNING_COLOR = '#F59E0B';
const PRIMARY_COLOR = '#0058BC';

export default function VerifyConfirmationScreen() {
    const router = useRouter();
    const user = useAuthStore((state) => state.user);
    const setUser = useAuthStore((state) => state.setUser);
    const params = useLocalSearchParams<{ token?: string }>();
    
    const [token, setToken] = useState('');
    const [serverError, setServerError] = useState<string | null>(null);
    const [serverSuccess, setServerSuccess] = useState<string | null>(null);
    const [isVerifying, setIsVerifying] = useState(false);
    const [isResending, setIsResending] = useState(false);
    const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
    
    // Animation values for success
    const scaleAnim = useRef(new Animated.Value(0.8)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;
    const rotationAnim = useRef(new Animated.Value(0)).current;

    // Auto-fill token from deep link URL
    useEffect(() => {
        if (params.token) {
            setToken(params.token as string);
        }
    }, [params.token]);

    // Auto-check verification status when coming from app
    useFocusEffect(
        useCallback(() => {
            const checkVerificationStatus = async () => {
                if (!user) return;
                
                try {
                    const updatedUser = await getMeService();
                    setUser(updatedUser);
                } catch (error) {
                    console.error('Failed to refresh user status:', error);
                }
            };

            checkVerificationStatus();
        }, [user?.id])
    );

    useEffect(() => {
        if (user?.is_email_verified) {
            runSuccessAnimation();
        }
    }, [user?.is_email_verified]);

    useEffect(() => {
        if (showSuccessAnimation) {
            const timer = setTimeout(() => {
                router.replace('/(tabs)/home');
            }, 2500);
            return () => clearTimeout(timer);
        }
    }, [showSuccessAnimation]);

    const runSuccessAnimation = () => {
        Animated.parallel([
            Animated.timing(scaleAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
            Animated.timing(opacityAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
            Animated.loop(
                Animated.sequence([
                    Animated.timing(rotationAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
                    Animated.timing(rotationAnim, { toValue: 0, duration: 1000, useNativeDriver: true }),
                ])
            )
        ]).start();
    };

    const handleVerify = async () => {
        setServerError(null);
        setServerSuccess(null);
        setIsVerifying(true);
        
        try {
            await verifyEmailService(token.trim());
            const updatedUser = await getMeService();
            setUser(updatedUser);
            setServerSuccess('E-mail verificado com sucesso!');
            setShowSuccessAnimation(true);
        } catch (error: any) {
            const message = error?.response?.data?.error?.message ?? 
                'Falha ao verificar e-mail. O token pode estar expirado ou inválido.';
            setServerError(message);
        } finally {
            setIsVerifying(false);
        }
    };

    const handleResendEmail = async () => {
        const email = user?.email;
        if (!email) return;
        
        setServerError(null);
        setServerSuccess(null);
        setIsResending(true);
        
        try {
            await resendVerificationEmailService(email);
            setServerSuccess('E-mail de verificação reenviado com sucesso!');
            setTimeout(() => setServerSuccess(null), 5000);
        } catch (error: any) {
            const message = error?.response?.data?.error?.message ?? 
                'Não foi possível reenviar o e-mail. Tente novamente.';
            setServerError(message);
        } finally {
            setIsResending(false);
        }
    };

    const handleGoHome = () => {
        if (user?.is_email_verified) {
            router.replace('/(tabs)/home');
        }
    };

    if (!user) {
        return null;
    }

    // Show success animation if email is verified
    if (user.is_email_verified) {
        return (
            <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: BACKGROUND_COLOR }}>
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <Animated.View 
                        style={{
                            opacity: opacityAnim,
                            transform: [{ scale: scaleAnim }]
                        }}
                    >
                        <View style={{
                            width: 120,
                            height: 120,
                            borderRadius: 60,
                            backgroundColor: SUCCESS_COLOR,
                            justifyContent: 'center',
                            alignItems: 'center',
                            marginBottom: 32
                        }}>
                            <Animated.View
                                style={{
                                    position: 'absolute',
                                    width: 120,
                                    height: 120,
                                    borderRadius: 60,
                                    borderWidth: 4,
                                    borderColor: '#FFFFFF',
                                    transform: [{
                                        rotate: rotationAnim.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: ['0deg', '360deg']
                                        })
                                    }]
                                }}
                            />
                            <Check size={50} color="#FFFFFF" strokeWidth={3} />
                        </View>
                        <Text style={{
                            fontSize: 28,
                            fontWeight: '700',
                            color: '#181C23',
                            marginBottom: 16,
                            textAlign: 'center'
                        }}>
                            E-mail verificado com sucesso!
                        </Text>
                        <Text style={{
                            fontSize: 16,
                            color: '#64748B',
                            textAlign: 'center',
                            marginHorizontal: 32,
                            lineHeight: 24
                        }}>
                            Todas as funcionalidades do Farol estão agora disponíveis.
                        </Text>
                    </Animated.View>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
            <View style={{ flex: 1 }}>
                <KeyboardAvoidingView
                    style={{ flex: 1 }}
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    enabled={Platform.OS === 'ios'}
                >
                    <ScrollView
                        contentContainerStyle={{ flexGrow: 1 }}
                        keyboardShouldPersistTaps="handled"
                    >
                        <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 40 }}>
                            {/* Logo do Farol */}
                            <View style={{ alignItems: 'center', marginBottom: 32 }}>
                                <Text
                                    style={{
                                        fontSize: 32,
                                        fontWeight: '800',
                                        color: '#181C23',
                                        letterSpacing: -0.5
                                    }}
                                >
                                    Farol
                                </Text>
                                <Text
                                    style={{
                                        marginTop: 8,
                                        fontSize: 14,
                                        color: '#64748B',
                                        fontStyle: 'italic'
                                    }}
                                >
                                    Mais segurança no seu caminho
                                </Text>
                            </View>

                            {/* Status de Verificação */}
                            <Box className="rounded-2xl bg-amber-50 p-5 mb-6">
                                <View className="flex-row items-start gap-3">
                                    <AlertCircle size={20} color={WARNING_COLOR} strokeWidth={2.2} />
                                    <Text className="text-sm text-amber-800 flex-1">
                                        <Text style={{ fontWeight: '600' }}>Conta não verificada</Text>
                                        {'\n'}
                                        Precisamos verificar seu e-mail para ter acesso completo ao Farol.
                                    </Text>
                                </View>
                            </Box>

                            {/* Informações do usuário */}
                            <Box className="rounded-2xl bg-gray-50 p-5 mb-6">
                                <Text style={{ fontSize: 16, fontWeight: '600', color: '#0F172A', marginBottom: 12 }}>
                                    Seu e-mail:
                                </Text>
                                <Box className="rounded-xl bg-white p-3 mb-4">
                                    <Text style={{ fontSize: 15, color: '#0F172A' }}>{user?.email}</Text>
                                </Box>
                                <Text style={{ fontSize: 16, fontWeight: '600', color: '#0F172A', marginBottom: 12 }}>
                                    Como verificar:
                                </Text>
                                <View className="flex-row items-center gap-3 p-3 rounded-xl bg-gray-50 mb-2">
                                    <Mail size={20} color='#0058BC' strokeWidth={2.2} />
                                    <Text className='text-sm text-gray-600 flex-1'>Acesse seu e-mail e clique em "Verificar e-mail"</Text>
                                </View>
                            </Box>

                            {/* Mensagem de sucesso */}
                            {serverSuccess && (
                                <Box className="rounded-xl bg-green-50 px-4 py-3 mb-4">
                                    <Text className="text-sm text-green-700">{serverSuccess}</Text>
                                </Box>
                            )}

                            {/* Mensagem de erro */}
                            {serverError && (
                                <Box className="rounded-xl bg-red-50 px-4 py-3 mb-4">
                                    <Text className="text-sm text-red-700">{serverError}</Text>
                                </Box>
                            )}

                            {/* Botão de reenvio */}
                            <Button
                                className="flex-row items-center justify-center gap-2 h-12 rounded-xl mb-3"
                                onPress={handleResendEmail}
                                disabled={isResending}
                            >
                                {isResending ? (
                                    <View style={{ width: 16, height: 16, borderColor: PRIMARY_COLOR, borderBottomWidth: 2, borderRadius: 4 }} />
                                ) : (
                                    <Send size={18} color={PRIMARY_COLOR} strokeWidth={2.2} />
                                )}
                                <ButtonText className="text-sm font-medium text-[#0058BC]">
                                    Reenviar e-mail de verificação
                                </ButtonText>
                            </Button>

                            {/* Campo do token */}
                            <Box className='mb-4'>
                                <Input className='rounded-xl'>
                                    <InputField 
                                        placeholder='Digite o código de verificação' 
                                        value={token} 
                                        onChangeText={setToken}
                                        autoCapitalize='none'
                                        autoCorrect={false}
                                        keyboardType='numeric'
                                        style={{ fontSize: 16, color: '#0F172A', textAlign: 'center' }}
                                        maxLength={6}
                                    />
                                </Input>
                            </Box>

                            {/* Botão de verificação */}
                            <Button
                                className={`h-12 rounded-xl mb-3 ${isVerifying ? 'bg-[#003F88]' : 'bg-[#0058BC]'}`}
                                onPress={handleVerify}
                                disabled={isVerifying || !token.trim() || token.length < 6}
                            >
                                <ButtonText className='text-sm font-medium text-white'>
                                    {isVerifying ? 'Verificando...' : 'Verificar e-mail'}
                                </ButtonText>
                            </Button>

                            {/* Botão voltar */}
                            <TouchableOpacity
                                onPress={handleGoHome}
                                activeOpacity={0.7}
                                className="mt-6 items-center"
                            >
                                <Text className="text-sm text-gray-500">
                                    Voltar para o Farol
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </View>
        </SafeAreaView>
    );
}
