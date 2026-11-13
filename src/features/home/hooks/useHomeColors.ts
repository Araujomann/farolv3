import { SEVERITY_COLORS } from "@/src/theme/colors";
import { useAppTheme } from "@/src/theme/useAppTheme";

/** Paleta usada pelos cards da Home, derivada do tema atual. */
export function useHomeColors() {
    const { colors } = useAppTheme();
    return {
    primary: colors.primary,
    background: colors.background,
    surface: colors.surface,
    surfaceIcon: colors.surfaceMuted,
    text: colors.onSurface,
    secondaryText: colors.onSurfaceVariant,
    border: colors.outlineVariant,
    positive: "#238636",
    positiveBackground: colors.successContainer,
    negative: colors.error,
    negativeBackground: colors.errorContainer,
    severity: SEVERITY_COLORS,
    };
}
