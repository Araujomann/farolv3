import { useEffect } from "react";
import {
    Stack,
    useRootNavigationState,
    useRouter,
    useSegments,
} from "expo-router";
import { ActivityIndicator, LogBox, View } from 'react-native';
import Mapbox from '@rnmapbox/maps';
import { GluestackUIProvider } from '@/components/ui/gluestack-ui-provider';
import { useAuthStore } from '@/src/store/authStore';
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
    const { token, isLoading, user, restoreSession } = useAuthStore();
    const segments = useSegments();
    const router = useRouter();
    const rootNavigationState = useRootNavigationState();

    usePushNotifications(Boolean(token));

    useEffect(() => {
        restoreSession();
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

        if (!token && !inAuthGroup) {
            // Sem token → vai para login
            router.replace("/(auth)/login");
        } else if (token && !inTabsGroup && !inPasswordRecovery) {
            // Com token mas fora da área logada
            // Verifica se precisa verificar e-mail
            if (!user?.is_email_verified) {
                router.replace("/(auth)/verify-reminder");
            } else {
                router.replace("/(tabs)/home");
            }
        }

    }, [token, isLoading, rootNavigationState?.key, segments, user?.is_email_verified]);

    return (
        <GluestackUIProvider mode="dark">
            <View className="flex-1">
                <Stack>
                    <Stack.Screen name="index" options={{ headerShown: false }} />
                    <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                    <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                </Stack>
                {isLoading && (
                    <View className="absolute inset-0 items-center justify-center bg-background">
                        <ActivityIndicator size="large" color="#0058BC" />
                    </View>
                )}
            </View>
        </GluestackUIProvider>
    );
}
