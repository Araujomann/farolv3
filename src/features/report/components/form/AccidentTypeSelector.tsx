import { Check, PenLine } from "lucide-react-native";
import type { RefObject } from "react";
import { Keyboard, Pressable, Text, TextInput, View } from "react-native";
import Animated, { FadeInDown, FadeOutUp } from "react-native-reanimated";

import { FieldLabel } from "@/src/features/report/components/form/FieldLabel";
import {
    ACCIDENT_TYPE_ICONS,
    ACCIDENT_TYPES,
    MAX_CUSTOM_TYPE_LENGTH,
    type ReportAccidentType,
} from "@/src/features/report/constants/reportOptions";
import { useTranslation } from "@/src/i18n";
import { useAppTheme } from "@/src/theme/useAppTheme";

type AccidentTypeSelectorProps = {
    accidentType: ReportAccidentType | null;
    onSelectAccidentType: (type: ReportAccidentType) => void;
    customType: string;
    onChangeCustomType: (text: string) => void;
    isCustomTypeFocused: boolean;
    onCustomTypeFocusChange: (isFocused: boolean) => void;
    customTypeInputRef: RefObject<TextInput | null>;
};

/** Seleção do tipo de acidente, com campo livre quando o tipo é "OUTRO". */
export function AccidentTypeSelector({
    accidentType,
    onSelectAccidentType,
    customType,
    onChangeCustomType,
    isCustomTypeFocused,
    onCustomTypeFocusChange,
    customTypeInputRef,
}: AccidentTypeSelectorProps) {
    const { t, language } = useTranslation();
    const { colors } = useAppTheme();
    return (
        <View className="mb-5 rounded-3xl bg-white dark:bg-[#1A1D24] p-4 shadow-lg">
            <FieldLabel label={t("report.form.accidentType")} required />
            <Text className="font-body mt-1 text-sm text-[#717786] dark:text-[#8B92A1]">
                {t("report.form.selectOption")}
            </Text>
            <View className="mt-3 flex-row gap-2.5">
                {ACCIDENT_TYPES.map((type) => {
                    const selected = accidentType === type;
                    const TypeIcon = ACCIDENT_TYPE_ICONS[type];
                    return (
                        <Pressable
                            key={type}
                            accessibilityRole="radio"
                            accessibilityState={{ selected }}
                            onPress={() =>
                                onSelectAccidentType(type)
                            }
                            className={`aspect-square flex-1 items-center justify-center rounded-2xl border px-1 ${
                                selected
                                    ? "border-[#0058BC] bg-[#E8F0FF] dark:bg-[#16253F]"
                                    : "border-[#C1C6D7]/60 dark:border-[#3A3F4B]/60 bg-white dark:bg-[#1A1D24]"
                            }`}
                        >
                            <TypeIcon
                                size={26}
                                color={
                                    selected
                                        ? colors.primary
                                        : colors.onSurfaceVariant
                                }
                                strokeWidth={2}
                            />
                            <Text
                                numberOfLines={1}
                                adjustsFontSizeToFit
                                minimumFontScale={0.72}
                                className={`mt-2 w-full text-center text-[10px] font-body-bold tracking-normal ${
                                    selected
                                        ? "text-[#0058BC] dark:text-[#3B87F5]"
                                        : "text-[#414755] dark:text-[#AAB0BD]"
                                }`}
                            >
                                {t(`enums.accidentType.${type}`).toLocaleUpperCase(language)}
                            </Text>
                            {selected && (
                                <View className="absolute right-2 top-2">
                                    <Check
                                        size={16}
                                        color={colors.primary}
                                        strokeWidth={2.5}
                                    />
                                </View>
                            )}
                        </Pressable>
                    );
                })}
            </View>
            {accidentType === "OUTRO" && (
                <Animated.View
                    entering={FadeInDown.duration(240)}
                    exiting={FadeOutUp.duration(160)}
                >
                    <View className="mt-4">
                        <Text className="font-body-semibold text-[13px] text-[#414755] dark:text-[#AAB0BD]">
                            {t("report.form.customTypeQuestion")}
                        </Text>
                        <View
                            className={`mt-2 flex-row items-center rounded-2xl border px-3 ${
                                isCustomTypeFocused
                                    ? "border-[#0058BC] bg-white dark:bg-[#1A1D24]"
                                    : "border-[#C1C6D7]/60 dark:border-[#3A3F4B]/60 bg-[#F8F9FF] dark:bg-[#0E1015]"
                            }`}
                        >
                            <PenLine
                                size={18}
                                color={
                                    isCustomTypeFocused
                                        ? colors.primary
                                        : colors.outline
                                }
                                strokeWidth={2.25}
                            />
                            <TextInput
                                ref={customTypeInputRef}
                                accessibilityLabel={t("report.form.accidentType")}
                                value={customType}
                                onChangeText={onChangeCustomType}
                                onFocus={() =>
                                    onCustomTypeFocusChange(true)
                                }
                                onBlur={() =>
                                    onCustomTypeFocusChange(false)
                                }
                                maxLength={MAX_CUSTOM_TYPE_LENGTH}
                                autoCapitalize="characters"
                                autoCorrect={false}
                                returnKeyType="done"
                                onSubmitEditing={Keyboard.dismiss}
                                placeholder={t("report.form.customTypePlaceholder")}
                                placeholderTextColor={colors.outline}
                                className="font-body-medium ml-2 h-12 flex-1 text-[15px] text-[#181C23] dark:text-[#ECEEF4]"
                            />
                        </View>
                    </View>
                </Animated.View>
            )}
        </View>
    );
}
