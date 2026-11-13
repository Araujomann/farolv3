import { Eye, EyeOff, type LucideIcon } from "lucide-react-native";
import type { ComponentProps } from "react";
import type { FieldError } from "react-hook-form";

import { Box } from "@/components/ui/box";
import { Input, InputField, InputIcon, InputSlot } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { useTranslation, type TranslationKey } from "@/src/i18n";
import { useAppTheme } from "@/src/theme/useAppTheme";

const LABEL_CLASS_NAMES = {
    default:
        "absolute -top-2 left-3.5 z-10 bg-white dark:bg-[#1A1D24] px-1.5 text-xs font-body-medium text-slate-500 dark:text-[#8B92A1]",
    // Variante usada no cadastro: rótulo um pouco mais à esquerda e estreito.
    compact:
        "absolute -top-2 left-3 z-10 bg-white dark:bg-[#1A1D24] px-1 text-xs font-body-medium text-slate-500 dark:text-[#8B92A1]",
} as const;

/** Classe do texto digitado; campos de código usam `CODE_INPUT_CLASS_NAME`. */
const DEFAULT_INPUT_CLASS_NAME =
    "text-sm font-body-medium text-slate-800 dark:text-[#ECEEF4]";
export const CODE_INPUT_CLASS_NAME =
    "text-sm font-body-medium tracking-[4px] text-slate-800 dark:text-[#ECEEF4]";

type AuthTextFieldProps = Omit<
    ComponentProps<typeof InputField>,
    "className" | "placeholderTextColor"
> & {
    label: string;
    icon: LucideIcon;
    /** Erro do react-hook-form; a mensagem é uma chave de tradução. */
    error?: FieldError;
    labelVariant?: keyof typeof LABEL_CLASS_NAMES;
    inputClassName?: string;
    /** Exibe o botão de mostrar/ocultar senha. */
    passwordVisibility?: {
        isVisible: boolean;
        onToggle: () => void;
    };
};

/**
 * Campo das telas de autenticação: rótulo flutuante, ícone, entrada,
 * botão opcional de mostrar/ocultar senha e mensagem de validação.
 */
export function AuthTextField({
    label,
    icon,
    error,
    labelVariant = "default",
    inputClassName = DEFAULT_INPUT_CLASS_NAME,
    passwordVisibility,
    ...inputFieldProps
}: AuthTextFieldProps) {
    const { colors } = useAppTheme();
    const { t } = useTranslation();

    return (
        <VStack space="xs">
            <Box className="relative">
                <Text className={LABEL_CLASS_NAMES[labelVariant]}>
                    {label}
                </Text>
                <Input
                    isInvalid={!!error}
                    className="h-12 rounded-xl border-slate-300 dark:border-[#3A3F4B] bg-white dark:bg-[#1A1D24] px-3 dark:bg-[#1A1D24]"
                >
                    <InputSlot className="pl-0">
                        <InputIcon as={icon} className="text-slate-400 dark:text-[#8B92A1]" />
                    </InputSlot>
                    <InputField
                        {...inputFieldProps}
                        placeholderTextColor={colors.outline}
                        className={inputClassName}
                    />
                    {passwordVisibility && (
                        <InputSlot
                            className="pr-0"
                            onPress={passwordVisibility.onToggle}
                            accessibilityLabel={
                                passwordVisibility.isVisible
                                    ? t("auth.hidePassword")
                                    : t("auth.showPassword")
                            }
                        >
                            <InputIcon
                                as={passwordVisibility.isVisible ? Eye : EyeOff}
                                className="text-slate-400 dark:text-[#8B92A1]"
                            />
                        </InputSlot>
                    )}
                </Input>
            </Box>
            {error && (
                <Text className="font-body text-xs text-red-600 dark:text-[#FF7B70]">
                    {t(error.message as TranslationKey)}
                </Text>
            )}
        </VStack>
    );
}
