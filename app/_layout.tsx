import { TamaguiProvider } from "tamagui";
import { tamaguiConfig } from "../tamagui.config";

import { Stack } from "expo-router";
import "react-native-reanimated";

import { useColorScheme } from "@/hooks/use-color-scheme";

export const unstable_settings = {
    anchor: "(tabs)",
};

export default function RootLayout() {
    const colorScheme = useColorScheme();

    return (
        <TamaguiProvider config={tamaguiConfig} defaultTheme="light">
            <Stack>
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen
                    name="modal"
                    options={{ presentation: "modal", title: "Modal" }}
                />
            </Stack>{" "}
        </TamaguiProvider>
    );
}
