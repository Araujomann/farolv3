import { useColorScheme } from "react-native";

import { darkColors, lightColors, type AppColors } from "./colors";

export type AppTheme = {
    isDark: boolean;
    colors: AppColors;
};

/**
 * Tema em uso. A preferência do usuário é aplicada globalmente via
 * `Appearance.setColorScheme` (ver `GluestackUIProvider`), então o
 * `useColorScheme` já devolve o esquema resolvido — e as classes `dark:`
 * do NativeWind acompanham o mesmo valor.
 */
export function useAppTheme(): AppTheme {
    const isDark = useColorScheme() === "dark";
    return { isDark, colors: isDark ? darkColors : lightColors };
}
