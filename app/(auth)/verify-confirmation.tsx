import React, { useState, useEffect } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity, View, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, Mail, Send, Shield, ShieldCheck } from 'lucide-react-native';
import { Text } from '@/components/ui/text';
import { Input, InputField } from '@/components/ui/input';
import { Button, ButtonText } from '@/components/ui/button';
import { VStack } from '@/components/ui/vstack';
import { Box } from '@/components/ui/box';
import { useAuthStore } from '@/src/store/authStore';
import { verifyEmailService, getMeService } from '@/src/api/auth';

export default function VerifyConfirmationScreen() {
    const router = useRouter();
    const user = useAuthStore((state) => state.user);
    const setUser = useAuthStore((state) => state.setUser);
    
    const [token, setToken] = useState('');
    const [serverError, setServerError] = useState<string | null>(null);
    const [serverSuccess, setServerSuccess] = useState<string | null>(null);
    const [isVerifying, setIsVerifying] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [isResending, setIsResending] = useState(false);
    
    const scaleAnim = new Animated.Value(0);
    const opacityAnim = new Animated.Value(0);

    useEffect(() => {
        if (user?.is_email_verified) {
            runSuccessAnimation();
        }
    }, [user?.is_email_verified]);

    useEffect(() => {
        if (showSuccess) {
            const timer = setTimeout(() => {
                router.replace('/(tabs)/home');
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [showSuccess]);

    const runSuccessAnimation = () => {
        Animated.parallel([
            Animated.timing(scaleAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
            Animated.timing(opacityAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        ]).start();
    };

    const handleVerify = async () => {
        setServerError(null);
        setServerSuccess(null);
        setShowSuccess(false);
        setIsVerifying(true);
        try {
            await verifyEmailService(token.trim());
            const updatedUser = await getMeService();
            setUser(updatedUser);
            setServerSuccess('E-mail verificado com sucesso!');
            setShowSuccess(true);
        } catch (error: any) {
            const message = error?.response?.data?.error?.message ?? 'Falha ao verificar e-mail. O token pode estar expirado ou inválido.';
            setServerError(message);
        } finally {
            setIsVerifying(false);
        }
    };

    const handleResendEmail = async () => {
        const email = user?.email;
        setServerError(null);
        setServerSuccess(null);
        setIsResending(true);
        try {
            setServerSuccess('E-mail reenviado com sucesso!');
        } catch (error: any) {
            setServerError('Não foi possível reenviar o e-mail.');
        } finally {
            setIsResending(false);
        }
    };

    const handleGoHome = () => {
        router.replace('/(tabs)/home');
    };

    if (!user) {
        return null;
    }

    return (
        <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
            <View style={{ flex: 1 }}>
                <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} enabled={Platform.OS === 'ios'}>
                    <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps='handled'>
                        <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 40 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24 }}>
                                <TouchableOpacity onPress={handleGoHome} activeOpacity={0.7} style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' }}>
                                    <ChevronLeft size={20} color='#475569' strokeWidth={2} />
                                </TouchableOpacity>
                                <Text style={{ fontSize: 20, fontWeight: '600', color: '#181C23', marginLeft: 12 }}>Verificar e-mail</Text>
                            </View>
                            {showSuccess && (
                                <Animated.View style={{ alignItems: 'center', marginBottom: 24, opacity: opacityAnim, transform: [{ scale: scaleAnim }] }}>
                                    <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: '#10B981', alignItems: 'center', justifyContent: 'center' }}>
                                        <ShieldCheck size={40} color='#FFFFFF' strokeWidth={2} />
                                    </View>
                                    <Text style={{ marginTop: 12, fontSize: 18, fontWeight: '600', color: '#10B981' }}>E-mail verificado!</Text>
                                </Animated.View>
                            )}
                            {!showSuccess && (
                                <>
                                    <Text style={{ fontSize: 14, color: '#64748B', marginBottom: 20, textAlign: 'center' }}>Recebemos seu link de verificação. Se o botão acima não funcionou, você pode inserir manualmente o token de verificação.</Text>
                                    <Text style={{ fontSize: 16, fontWeight: '600', color: '#0F172A', marginBottom: 12 }}>Seu e-mail:</Text>
                                    <Box className='rounded-xl bg-gray-50 p-3 mb-4'>
                                        <Text style={{ fontSize: 15, color: '#0F172A' }}>{user.email}</Text>
                                    </Box>
                                    <Text style={{ fontSize: 16, fontWeight: '600', color: '#0F172A', marginBottom: 12 }}>Token de verificação:</Text>
                                    <VStack className='gap-3 mb-4'>
                                        <Box className='flex-row items-center gap-3 p-4 rounded-xl bg-gray-50'>
                                            <Mail size={20} color='#0058BC' strokeWidth={2.2} />
                                            <Text className='text-sm text-gray-600 flex-1'>Acesse seu e-mail e cole o token de verificação</Text>
                                        </Box>
                                    </VStack>
                                    <Box className='mb-4'>
                                        <Input className='rounded-xl'>
                                            <InputField placeholder='Digite o token de verificação' value={token} onChangeText={setToken} autoCapitalize='none' autoCorrect={false} keyboardType='default' textContentType='oneTimeCode' style={{ fontSize: 16, color: '#0F172A' }} />
                                        </Input>
                                    </Box>
                                    {serverError && (
                                        <Box className='rounded-xl bg-red-50 px-4 py-3 mb-4'>
                                            <Text className='text-sm text-red-700'>{serverError}</Text>
                                        </Box>
                                    )}
                                    {serverSuccess && (
                                        <Box className='rounded-xl bg-green-50 px-4 py-3 mb-4'>
                                            <Text className='text-sm text-green-700'>{serverSuccess}</Text>
                                        </Box>
                                    )}
                                    <Button className='h-12 rounded-xl bg-[#0058BC] mb-3' onPress={handleVerify} disabled={isVerifying || !token.trim()}>
                                        <ButtonText className='text-sm font-medium text-white'>{isVerifying ? 'Verificando...' : 'Verificar e-mail'}</ButtonText>
                                    </Button>
                                    <Button variant='outline' className='flex-row items-center justify-center gap-2 h-12 rounded-xl mb-3' onPress={handleResendEmail} disabled={isResending}>
                                        {isResending ? (<View style={{ width: 16, height: 16, borderColor: '#0058BC', borderBottomWidth: 2, borderRadius: 4 }} />) : (<Send size={16} color='#0058BC' strokeWidth={2} />)}
                                        <ButtonText className='text-sm font-medium text-[#0058BC]'>{isResending ? 'Reenviando...' : 'Reenviar e-mail de verificação'}</ButtonText>
                                    </Button>
                                </>
                            )}
                            <TouchableOpacity onPress={handleGoHome} activeOpacity={0.7} className='mt-6 items-center'>
                                <Text className='text-sm text-gray-500'>Voltar para casa</Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </View>
        </SafeAreaView>
    );
}
