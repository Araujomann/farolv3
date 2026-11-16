import { useEffect } from "react";
import {
    Stack,
    useRootNavigationState,
    useRouter,
    useSegments,
} from "expo-router";
import { ActivityIndicator, LogBox, View } from 'react-native';
import Mapbox from '@rnmapbox/maps';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import {
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
} from '@expo-google-fonts/inter';
import {
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans';
import { GluestackUIProvider } from '@/components/ui/gluestack-ui-provider';
import { StatusBar } from 'expo-status-bar';
import {
    DarkTheme,
    DefaultTheme,
    ThemeProvider,
    type Theme,
} from '@react-navigation/native';
import { useAuthStore } from '@/src/store/authStore';
import { useThemeStore } from '@/src/theme/themeStore';
import { useAppTheme } from '@/src/theme/useAppTheme';
import { useLanguageStore } from '@/src/i18n';
import { usePushNotifications } from '@/src/features/notifications/usePushNotifications';
import { useNotificationNavigation } from '@/src/features/notifications/useNotificationNavigation';
import { ServerWakingNotice } from '@/src/api/ServerWakingNotice';
import { useIsServerSlow } from '@/src/api/serverStatus';
import { needsTermsAcceptance } from '@/src/features/legal/legalConfig';
import "react-native-reanimated";
import "../global.css"

const mapboxToken = process.env.EXPO_PUBLIC_MAPBOX_TOKEN;

if (!mapboxToken) {
  throw new Error("EXPO_PUBLIC_MAPBOX_TOKEN não foi encontrada.");
}

Mapbox.setAccessToken(mapboxToken);

LogBox.ignoreLogs(['Unable to activate keep awake']);

// Mantém a splash nativa (escudo do Farol sobre o azul) até sessão, fontes,
// tema e idioma estarem prontos, e então some com um fade suave. Se a sessão
// demorar (API acordando da hibernação), a splash sai antes para o aviso de
// conexão aparecer sobre o indicador de carregamento.
SplashScreen.preventAutoHideAsync().catch(() => {});
SplashScreen.setOptions({ duration: 400, fade: true });

export default function RootLayout() {
    const { token, isLoading, user, restoreSession, emailVerificationPrompt } =
        useAuthStore();
    const segments = useSegments();
    const router = useRouter();
    const rootNavigationState = useRootNavigationState();
    const [fontsLoaded, fontError] = useFonts({
        Inter_400Regular,
        Inter_500Medium,
        Inter_600SemiBold,
        Inter_700Bold,
        PlusJakartaSans_600SemiBold,
        PlusJakartaSans_700Bold,
        PlusJakartaSans_800ExtraBold,
    });
    // Em caso de erro no carregamento, segue com a fonte do sistema.
    const fontsReady = fontsLoaded || Boolean(fontError);

    const themePreference = useThemeStore((state) => state.preference);
    const isThemeHydrated = useThemeStore((state) => state.isHydrated);
    const hydrateTheme = useThemeStore((state) => state.hydrate);
    const isLanguageHydrated = useLanguageStore((state) => state.isHydrated);
    const hydrateLanguage = useLanguageStore((state) => state.hydrate);
    const { colors, isDark } = useAppTheme();
    const baseNavigationTheme = isDark ? DarkTheme : DefaultTheme;
    const navigationTheme: Theme = {
        ...baseNavigationTheme,
        colors: {
            ...baseNavigationTheme.colors,
            primary: colors.primary,
            background: colors.background,
            card: colors.surface,
            text: colors.onSurface,
            border: colors.outlineVariant,
        },
    };

    usePushNotifications(Boolean(token));
    // Só abre o mapa da notificação depois que o redirecionamento inicial
    // levou o usuário à área logada (sessão restaurada e termos aceitos).
    useNotificationNavigation(
        Boolean(token) &&
            !isLoading &&
            Boolean(rootNavigationState?.key) &&
            segments[0] === "(tabs)",
    );

    const isUiReady = fontsReady && isThemeHydrated && isLanguageHydrated;
    const isAppReady = !isLoading && isUiReady;
    const isServerSlow = useIsServerSlow();

    useEffect(() => {
        if (isUiReady && (isAppReady || isServerSlow)) SplashScreen.hide();
    }, [isUiReady, isAppReady, isServerSlow]);

    useEffect(() => {
        restoreSession();
        hydrateTheme();
        hydrateLanguage();
    }, []);

    useEffect(() => {
        // Aguarda o restoreSession() terminar antes de qualquer redirect
        if (isLoading || !rootNavigationState?.key) return;

        const inAuthGroup = segments[0] === "(auth)";
        const inTabsGroup = segments[0] === "(tabs)";
        const inPasswordRecovery =
            inAuthGroup &&
            (segments[1] === "forgot-password" ||
                segments[1] === "reset-password");
        const inEmailVerification =
            inAuthGroup && segments[1] === "verify-email";
        // Termos e Política ficam abertos com ou sem sessão (o cadastro e as
        // configurações apontam para eles); o aceite exige sessão.
        const inLegalGroup = segments[0] === "legal";
        const inTermsAcceptance = inLegalGroup && segments[1] === "accept";
        const mustAcceptTerms = Boolean(
            token && user && needsTermsAcceptance(user),
        );

        if (!token) {
            // Sem token → vai para login
            if (
                !(inAuthGroup || inLegalGroup) ||
                inEmailVerification ||
                inTermsAcceptance
            ) {
                router.replace("/(auth)/login");
            }
        } else if (mustAcceptTerms) {
            // Conta sem aceite da versão atual dos textos (LGPD) → tela de
            // aceite, de onde os textos podem ser lidos. Não interrompe a
            // recuperação de senha nem a confirmação de e-mail em andamento.
            if (!inLegalGroup && !inPasswordRecovery && !inEmailVerification) {
                router.replace("/legal/accept");
            }
        } else if (
            !inTabsGroup &&
            !inPasswordRecovery &&
            !inEmailVerification &&
            (!inLegalGroup || inTermsAcceptance)
        ) {
            // Com token mas fora da área logada.
            // Logo após cadastro/login sem e-mail verificado → tela do código.
            // (No cadastro o código já foi enviado; no login pedimos um novo.)
            if (!user?.is_email_verified && emailVerificationPrompt) {
                router.replace({
                    pathname: "/(auth)/verify-email",
                    params:
                        emailVerificationPrompt === "login"
                            ? { send: "1" }
                            : {},
                });
            } else {
                router.replace("/(tabs)/home");
            }
        }

    }, [
        token,
        isLoading,
        rootNavigationState?.key,
        segments,
        user?.is_email_verified,
        user?.terms_version,
        emailVerificationPrompt,
    ]);

    // Só monta as telas depois que as fontes carregarem (a splash continua
    // visível). No Android o texto medido com a fonte do sistema não é
    // remedido quando a fonte customizada chega, e a última palavra some.
    if (!fontsReady) return null;

    return (
        <GluestackUIProvider mode={themePreference}>
            <ThemeProvider value={navigationTheme}>
                <StatusBar style="auto" />
                <View className="flex-1" style={{ backgroundColor: colors.background }}>
                    <Stack>
                        <Stack.Screen name="index" options={{ headerShown: false }} />
                        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                        <Stack.Screen name="legal" options={{ headerShown: false }} />
                    </Stack>
                    {!isAppReady && (
                        <View
                            className="absolute inset-0 items-center justify-center"
                            style={{ backgroundColor: colors.background }}
                        >
                            <ActivityIndicator size="large" color={colors.primary} />
                        </View>
                    )}
                    <ServerWakingNotice />
                </View>
            </ThemeProvider>
        </GluestackUIProvider>
    );
}
