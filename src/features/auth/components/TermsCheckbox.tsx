import { Check } from "lucide-react-native";
import { Pressable, StyleSheet, View } from "react-native";

import { Text } from "@/components/ui/text";
import { useTranslation } from "@/src/i18n";
import { type AppColors } from "@/src/theme/colors";
import { useAppTheme } from "@/src/theme/useAppTheme";

type TermsCheckboxProps = {
    value: boolean;
    onChange: (value: boolean) => void;
};

/** Aceite dos termos de uso e da política de privacidade no cadastro. */
export function TermsCheckbox({ value, onChange }: TermsCheckboxProps) {
    const styles = createStyles(useAppTheme().colors);
    const { t } = useTranslation();

    return (
        <Pressable
            onPress={() => onChange(!value)}
            className="flex-row items-center gap-2 pt-1"
            accessibilityRole="checkbox"
            accessibilityState={{
                checked: value,
            }}
        >
            <View
                style={[
                    styles.checkbox,
                    value && styles.checkboxChecked,
                ]}
            >
                {value && (
                    <Check
                        size={12}
                        color="#FFFFFF"
                        strokeWidth={2.5}
                    />
                )}
            </View>

            <Text className="flex-1 text-xs font-body-medium text-slate-500 dark:text-[#8B92A1]">
                {t("auth.register.agreePrefix")}{" "}
                <Text className="text-xs font-body-semibold text-[#0058BC] dark:text-[#3B87F5]">
                    {t("auth.register.terms")}
                </Text>
                {" "}{t("auth.register.and")}{" "}
                <Text className="text-xs font-body-semibold text-[#0058BC] dark:text-[#3B87F5]">
                    {t("auth.register.privacy")}
                </Text>
            </Text>
        </Pressable>
    );
}

const createStyles = (colors: AppColors) => StyleSheet.create({
    checkbox: {
        width: 16,
        height: 16,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: colors.outlineVariant,
        backgroundColor: colors.surface,
        alignItems: "center",
        justifyContent: "center",
    },

    checkboxChecked: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
});
