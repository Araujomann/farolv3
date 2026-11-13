import { ActivityIndicator, Pressable, View } from "react-native";

import { Text } from "@/components/ui/text";
import { useTranslation } from "@/src/i18n";
import { useAppTheme } from "@/src/theme/useAppTheme";

type LogoutSectionProps = {
    isLoggingOut: boolean;
    onPress: () => void;
};

export function LogoutSection({ isLoggingOut, onPress }: LogoutSectionProps) {
    const { t } = useTranslation();
    const { colors } = useAppTheme();
    return (
        <View
            className="mt-4 overflow-hidden rounded-xl"
            style={{
                backgroundColor: colors.surface,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 4,
                elevation: 2,
            }}
        >
            <Pressable
                onPress={onPress}
                disabled={isLoggingOut}
                className="flex-row items-center justify-center px-5 py-4"
                style={({ pressed }) => ({
                    backgroundColor: pressed ? colors.errorContainer : colors.surface,
                })}
            >
                {isLoggingOut ? (
                    <ActivityIndicator size="small" color={colors.error} />
                ) : (
                    <Text
                        className="text-base font-body-semibold"
                        style={{ color: colors.error }}
                    >
                        {t("profile.logout")}
                    </Text>
                )}
            </Pressable>
        </View>
    );
}
