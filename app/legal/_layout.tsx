import { Stack } from "expo-router";

/** Termos de Uso, Política de Privacidade e aceite: com ou sem sessão. */
export default function LegalLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="terms" />
            <Stack.Screen name="privacy" />
            <Stack.Screen name="accept" options={{ gestureEnabled: false }} />
        </Stack>
    );
}
