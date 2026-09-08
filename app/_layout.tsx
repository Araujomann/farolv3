import { useEffect } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { ActivityIndicator, LogBox, View } from 'react-native';
import Mapbox from '@rnmapbox/maps';
import { GluestackUIProvider } from '@/components/ui/gluestack-ui-provider';
import { useAuthStore } from '@/src/store/authStore';
import "react-native-reanimated";
import "../global.css"

const mapboxToken = process.env.EXPO_PUBLIC_MAPBOX_TOKEN;

if (!mapboxToken) {
  throw new Error("EXPO_PUBLIC_MAPBOX_TOKEN não foi encontrada.");
}

Mapbox.setAccessToken(mapboxToken);

LogBox.ignoreLogs(['Unable to activate keep awake']);

export default function RootLayout() {
    const { token, isLoading, restoreSession } = useAuthStore();
    const segments = useSegments();
    const router = useRouter();

    useEffect(() => {
        restoreSession();
    }, []);

    useEffect(() => {
        // Aguarda o restoreSession() terminar antes de qualquer redirect
        if (isLoading) return;

        const inAuthGroup = segments[0] === "(auth)";
        const inTabsGroup = segments[0] === "(tabs)";

        if (!token && !inAuthGroup) {
            // Sem token → vai para login
            router.replace("/(auth)/login");
        } else if (token && !inTabsGroup) {
            // Com token mas fora da área logada → vai para home
            router.replace("/(tabs)/home");
        }

    }, [token, isLoading, segments]);

    if (isLoading) {
        return (
            <View className="flex-1 items-center justify-center bg-background">
                <ActivityIndicator size="large" color="#0058BC" />
            </View>
        );
    }

    return (
        <GluestackUIProvider mode="dark">
            <Stack>
                <Stack.Screen name="index" options={{ headerShown: false }} />
                <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen
                    name="modal"
                    options={{ presentation: "modal", title: "Modal" }}
                />
            </Stack>
        </GluestackUIProvider>
    );
}

