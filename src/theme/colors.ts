/**
 * Paleta de cores do app nos modos claro e escuro.
 *
 * Use sempre via `useAppTheme().colors` em estilos inline/props de cor, para
 * que a interface reaja à troca de tema. Cores de marca que não dependem do
 * tema (níveis de gamificação, marcadores do mapa) continuam literais.
 */
export type AppColors = {
    /** Fundo das telas. */
    background: string;
    /** Cartões, barras e folhas. */
    surface: string;
    /** Superfície levemente destacada (chips, ícones, linhas pressionadas). */
    surfaceMuted: string;
    /** Superfície mais destacada (trilhas de progresso, placeholders). */
    surfaceStrong: string;
    /** Texto principal. */
    onSurface: string;
    /** Texto secundário. */
    onSurfaceVariant: string;
    /** Texto terciário, placeholders e ícones desativados. */
    outline: string;
    /** Bordas e divisores. */
    outlineVariant: string;
    /** Divisor suave dentro de cartões. */
    divider: string;

    primary: string;
    /** Cor de destaque usada nas abas e realces. */
    accent: string;
    onPrimary: string;
    primaryContainer: string;
    onPrimaryContainer: string;

    error: string;
    errorContainer: string;
    errorBorder: string;

    success: string;
    successContainer: string;

    warning: string;
    warningContainer: string;
    onWarningContainer: string;

    /** Véu escuro atrás de diálogos. */
    scrim: string;
    shadow: string;
};

export const lightColors: AppColors = {
    background: "#F2F2F7",
    surface: "#FFFFFF",
    surfaceMuted: "#F1F3FE",
    surfaceStrong: "#E2E4ED",
    onSurface: "#181C23",
    onSurfaceVariant: "#414755",
    outline: "#717786",
    outlineVariant: "#C1C6D7",
    divider: "#F0F1F6",

    primary: "#0058BC",
    accent: "#0969D7",
    onPrimary: "#FFFFFF",
    primaryContainer: "#EAF1FF",
    onPrimaryContainer: "#003F88",

    error: "#BA1A1A",
    errorContainer: "#FFF8F5",
    errorBorder: "#F0B7A8",

    success: "#14804A",
    successContainer: "#EAF7EF",

    warning: "#D99A24",
    warningContainer: "#FFF8E8",
    onWarningContainer: "#704800",

    scrim: "rgba(0, 0, 0, 0.45)",
    shadow: "#000000",
};

export const darkColors: AppColors = {
    background: "#0E1015",
    surface: "#1A1D24",
    surfaceMuted: "#242833",
    surfaceStrong: "#2E3340",
    onSurface: "#ECEEF4",
    onSurfaceVariant: "#AAB0BD",
    outline: "#8B92A1",
    outlineVariant: "#3A3F4B",
    divider: "#2A2E38",

    primary: "#3B87F5",
    accent: "#4C9BFF",
    onPrimary: "#FFFFFF",
    primaryContainer: "#16253F",
    onPrimaryContainer: "#ADC6FF",

    error: "#FF7B70",
    errorContainer: "#2C1715",
    errorBorder: "#5C2C26",

    success: "#5BD48A",
    successContainer: "#12271B",

    warning: "#F2C14E",
    warningContainer: "#2B2313",
    onWarningContainer: "#F5D58A",

    scrim: "rgba(0, 0, 0, 0.6)",
    shadow: "#000000",
};

/** Cores de gravidade dos acidentes — iguais nos dois temas (identidade). */
export const SEVERITY_COLORS = {
    low: "#0969D7",
    medium: "#D99A24",
    high: "#D9534F",
    critical: "#B42318",
} as const;
