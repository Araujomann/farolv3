import { Text, TextInput, View } from "react-native";

import { FieldLabel } from "@/src/features/report/components/form/FieldLabel";
import { MAX_DESCRIPTION_LENGTH } from "@/src/features/report/constants/reportOptions";
import { useTranslation } from "@/src/i18n";
import { useAppTheme } from "@/src/theme/useAppTheme";

type DescriptionFieldProps = {
    value: string;
    onChangeText: (text: string) => void;
    onFocus: () => void;
    onBlur: () => void;
};

/** Descrição opcional, com contador de caracteres. */
export function DescriptionField({
    value,
    onChangeText,
    onFocus,
    onBlur,
}: DescriptionFieldProps) {
    const { t } = useTranslation();
    const { colors } = useAppTheme();
    return (
        <View className="rounded-3xl bg-white dark:bg-[#1A1D24] p-4 shadow-lg">
            <FieldLabel label={t("report.form.description")} />
            <TextInput
                accessibilityLabel={t("report.form.description")}
                multiline
                maxLength={MAX_DESCRIPTION_LENGTH}
                value={value}
                onFocus={onFocus}
                onBlur={onBlur}
                onChangeText={onChangeText}
                placeholder={t("report.form.descriptionPlaceholder")}
                placeholderTextColor={colors.outline}
                textAlignVertical="top"
                className="font-body mt-3 min-h-[150px] rounded-2xl border border-[#C1C6D7]/60 dark:border-[#3A3F4B]/60 bg-[#F8F9FF] dark:bg-[#0E1015] px-3 py-3 text-[15px] leading-5 text-[#181C23] dark:text-[#ECEEF4]"
            />
            <Text className="mt-2 text-right text-xs font-body-medium text-[#717786] dark:text-[#8B92A1]">
                {value.length}/{MAX_DESCRIPTION_LENGTH}
            </Text>
        </View>
    );
}
