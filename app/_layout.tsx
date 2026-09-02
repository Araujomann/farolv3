import { useEffect } from "react";
import { Stack , useRouter, useSegments } from "expo-router";
import { LogBox } from 'react-native';
import Mapbox from '@rnmapbox/maps';
import { GluestackUIProvider } from '@/components/ui/gluestack-ui-provider';
import { useAuthStore } from '@/src/store/AuthStore';
import "react-native-reanimated";
import "../global.css"

const mapboxToken = process.env.EXPO_PUBLIC_MAPBOX_TOKEN;

if (!mapboxToken) {
  throw new Error("EXPO_PUBLIC_MAPBOX_TOKEN não foi encontrada.");
}

Mapbox.setAccessToken(mapboxToken);

LogBox.ignoreLogs(['Unable to activate keep awake']);



export default function RootLayout() {
    const {token, isLoading, restoreSession} = useAuthStore();
    const segments = useSegments();
    const router = useRouter();

    useEffect(() => {
        restoreSession();
    }, [])

    useEffect(() => {
        if (!isLoading) return

        const inAuthGroup = segments[0] === "(auth)";

        if(!token && !inAuthGroup) {
            router.replace("/(auth)/login");
        } else if(token && inAuthGroup) {
            router.replace("/(tabs)/home");
        }
        
    }, [token, isLoading, segments])

    if (isLoading) {
        return null;
    }

    return (
    <GluestackUIProvider mode="dark">
      <Stack>
                <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                <Stack.Screen
                    name="modal"
                    options={{ presentation: "modal", title: "Modal" }}
                />
            </Stack>
    </GluestackUIProvider>
  
    );
}
