import { Stack } from "expo-router";
import "../global.css"
import "react-native-reanimated";

import { GluestackUIProvider } from '@/components/ui/gluestack-ui-provider';
import '@/global.css';

export default function RootLayout() {
    return (
            
    <GluestackUIProvider mode="dark">
      <Stack>
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen
                    name="modal"
                    options={{ presentation: "modal", title: "Modal" }}
                />
            </Stack>
    </GluestackUIProvider>
  
    );
}
