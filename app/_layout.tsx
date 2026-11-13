import { useEffect } from "react";
import {
    Stack,
    useRootNavigationState,
    useRouter,
    useSegments,
} from "expo-router";
import { ActivityIndicator, LogBox, View } from 'react-native';
import Mapbox from '@rnmapbox/maps';
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
import "react-native-reanimated";
import "../global.css"

const mapboxToken = process.env.EXPO_PUBLIC_MAPBOX_TOKEN;

if (!mapboxToken) {
  throw new Error("EXPO_PUBLIC_MAPBOX_TOKEN não foi encontrada.");
}

Mapbox.setAccessToken(mapboxToken);

LogBox.ignoreLogs(['Unable to activate keep awake']);

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

        if (!token && (!inAuthGroup || inEmailVerification)) {
            // Sem token → vai para login
            router.replace("/(auth)/login");
        } else if (
            token &&
            !inTabsGroup &&
            !inPasswordRecovery &&
            !inEmailVerification
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
        emailVerificationPrompt,
    ]);

    return (
        <GluestackUIProvider mode={themePreference}>
            <ThemeProvider value={navigationTheme}>
                <StatusBar style="auto" />
                <View className="flex-1" style={{ backgroundColor: colors.background }}>
                    <Stack>
                        <Stack.Screen name="index" options={{ headerShown: false }} />
                        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                    </Stack>
                    {(isLoading || !fontsReady || !isThemeHydrated || !isLanguageHydrated) && (
                        <View
                            className="absolute inset-0 items-center justify-center"
                            style={{ backgroundColor: colors.background }}
                        >
                            <ActivityIndicator size="large" color={colors.primary} />
                        </View>
                    )}
                </View>
            </ThemeProvider>
        </GluestackUIProvider>
    );
}
