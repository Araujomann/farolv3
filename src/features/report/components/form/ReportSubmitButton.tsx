import { Send } from "lucide-react-native";
import { ActivityIndicator, Pressable, Text } from "react-native";

import { useTranslation } from "@/src/i18n";

type ReportSubmitButtonProps = {
    isSubmitting: boolean;
    onPress: () => void;
};

export function ReportSubmitButton({
    isSubmitting,
    onPress,
}: ReportSubmitButtonProps) {
    const { t, language } = useTranslation();
    return (
        <Pressable
            accessibilityLabel={t("report.form.submitLabel")}
            accessibilityRole="button"
            disabled={isSubmitting}
            onPress={onPress}
            className={`mt-5 h-14 flex-row items-center justify-center gap-2 rounded-2xl bg-[#0058BC] px-4 shadow-lg ${
                isSubmitting ? "opacity-70" : ""
            }`}
            style={({ pressed }) => ({
                opacity: isSubmitting ? 0.7 : pressed ? 0.82 : 1,
                transform: [{ scale: pressed ? 0.99 : 1 }],
            })}
        >
            {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" />
            ) : (
                <>
                    <Send
                        size={20}
                        color="#FFFFFF"
                        strokeWidth={2.25}
                    />
                    <Text className="text-[16px] font-display tracking-wide text-white">
                        {t("report.form.submit").toLocaleUpperCase(language)}
                    </Text>
                </>
            )}
        </Pressable>
    );
}
