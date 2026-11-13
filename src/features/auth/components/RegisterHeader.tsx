import { ChevronLeft } from "lucide-react-native";
import { Image, StyleSheet, TouchableOpacity, View } from "react-native";

import { Text } from "@/components/ui/text";
import { useTranslation } from "@/src/i18n";
import { type AppColors } from "@/src/theme/colors";
import { useAppTheme } from "@/src/theme/useAppTheme";

/** Cabeçalho do cadastro: botão voltar e marca centralizada. */
export function RegisterHeader({ onBack }: { onBack: () => void }) {
    const { colors } = useAppTheme();
    const styles = createStyles(colors);
    const { t } = useTranslation();

    return (
        <View style={styles.header}>
            <TouchableOpacity
                onPress={onBack}
                activeOpacity={0.7}
                style={styles.backButton}
                accessibilityRole="button"
                accessibilityLabel={t("common.back")}
            >
                <ChevronLeft
                    size={20}
                    color={colors.onSurfaceVariant}
                    strokeWidth={2}
                />
            </TouchableOpacity>

            <View
                style={styles.brandContainer}
                pointerEvents="none"
            >
                <Image
                    source={require(
                        "../../../../assets/images/app-icon.png"
                    )}
                    style={styles.brandIcon}
                    resizeMode="contain"
                    accessibilityLabel={t("auth.logoLabel")}
                />

                <Text className="font-body" style={styles.brandName}>
                    Farol
                </Text>
            </View>
        </View>
    );
}

const createStyles = (colors: AppColors) => StyleSheet.create({
    header: {
        height: 60,
        backgroundColor: colors.surfaceMuted,
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 18,
        position: "relative",
    },

    backButton: {
        width: 32,
        height: 32,
        backgroundColor: colors.surface,
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
        zIndex: 2,
    },

    brandContainer: {
        position: "absolute",
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 7,
    },

    brandIcon: {
        width: 28,
        height: 28,
    },

    brandName: {
        fontSize: 16,
        fontFamily: "PlusJakartaSans_700Bold",
        color: colors.onSurface,
    },
});
