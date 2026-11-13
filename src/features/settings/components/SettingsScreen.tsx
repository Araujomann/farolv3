import { useRouter } from "expo-router";
import {
    ArrowLeft,
    Check,
    ChevronRight,
    Globe,
    Languages,
    Moon,
    Smartphone,
    Sun,
    Trash2,
    type LucideIcon,
} from "lucide-react-native";
import { Pressable, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Text } from "@/components/ui/text";
import {
    getSystemLanguage,
    LANGUAGE_NATIVE_NAMES,
    SUPPORTED_LANGUAGES,
    useLanguageStore,
    useTranslation,
    type TranslationKey,
} from "@/src/i18n";
import { useThemeStore, type ThemePreference } from "@/src/theme/themeStore";
import { useAppTheme } from "@/src/theme/useAppTheme";

const THEME_OPTIONS: {
    value: ThemePreference;
    label: TranslationKey;
    description?: TranslationKey;
    icon: LucideIcon;
}[] = [
    {
        value: "system",
        label: "settings.appearance.system",
        description: "settings.appearance.systemDescription",
        icon: Smartphone,
    },
    { value: "light", label: "settings.appearance.light", icon: Sun },
    { value: "dark", label: "settings.appearance.dark", icon: Moon },
];

export default function SettingsScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { colors } = useAppTheme();
    const { t } = useTranslation();

    return (
        <View className="flex-1" style={{ backgroundColor: colors.background }}>
            <View
                className="flex-row items-center justify-between px-4"
                style={{
                    backgroundColor: colors.surface,
                    height: 56 + insets.top,
                    paddingTop: insets.top,
                }}
            >
                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={t("settings.backToProfile")}
                    onPress={() => router.back()}
                    className="h-11 w-11 items-center justify-center"
                >
                    <ArrowLeft size={24} color={colors.primary} />
                </Pressable>
                <Text
                    className="text-lg font-body-semibold"
                    style={{ color: colors.onSurface }}
                >
                    {t("settings.title")}
                </Text>
                <View className="h-11 w-11" />
            </View>

            <ScrollView
                contentContainerStyle={{
                    paddingHorizontal: 16,
                    paddingTop: 8,
                    paddingBottom: insets.bottom + 100,
                }}
                showsVerticalScrollIndicator={false}
            >
                <ThemeSection />
                <LanguageSection />
                <AccountSection
                    onDeleteAccountPress={() =>
                        router.push("/profile/delete-account")
                    }
                />
            </ScrollView>
        </View>
    );
}

/* ── Building blocks ─────────────────────────────────────────── */

function SectionTitle({ children }: { children: string }) {
    const { colors } = useAppTheme();

    return (
        <Text
            className="mb-2 ml-4 mt-6 text-[12px] font-body-semibold uppercase tracking-widest"
            style={{ color: colors.onSurfaceVariant }}
        >
            {children}
        </Text>
    );
}

function SectionCard({ children }: { children: React.ReactNode }) {
    const { colors, isDark } = useAppTheme();

    return (
        <View
            className="overflow-hidden rounded-xl"
            style={{
                backgroundColor: colors.surface,
                shadowColor: colors.shadow,
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: isDark ? 0 : 0.05,
                shadowRadius: 4,
                elevation: isDark ? 0 : 2,
            }}
        >
            {children}
        </View>
    );
}

function SectionDivider() {
    const { colors } = useAppTheme();

    return (
        <View
            className="h-px"
            style={{ marginLeft: 68, backgroundColor: colors.divider }}
        />
    );
}

type OptionRowProps = {
    icon: LucideIcon;
    label: string;
    description?: string;
    isSelected: boolean;
    onPress: () => void;
};

function OptionRow({
    icon: Icon,
    label,
    description,
    isSelected,
    onPress,
}: OptionRowProps) {
    const { colors } = useAppTheme();

    return (
        <Pressable
            accessibilityRole="radio"
            accessibilityState={{ checked: isSelected }}
            accessibilityLabel={label}
            onPress={onPress}
            className="flex-row items-center justify-between px-5 py-4"
            style={({ pressed }) => ({
                backgroundColor: pressed ? colors.surfaceMuted : colors.surface,
            })}
        >
            <View className="flex-1 flex-row items-center gap-4 pr-3">
                <View
                    className="h-8 w-8 items-center justify-center rounded-lg"
                    style={{ backgroundColor: colors.surfaceMuted }}
                >
                    <Icon size={20} color={colors.primary} strokeWidth={2} />
                </View>
                <View className="flex-1">
                    <Text
                        className="font-body text-base"
                        style={{ color: colors.onSurface }}
                    >
                        {label}
                    </Text>
                    {description ? (
                        <Text
                            className="font-body mt-0.5 text-[13px]"
                            style={{ color: colors.onSurfaceVariant }}
                        >
                            {description}
                        </Text>
                    ) : null}
                </View>
            </View>
            {isSelected && (
                <Check size={20} color={colors.primary} strokeWidth={2.5} />
            )}
        </Pressable>
    );
}

/* ── Sections ────────────────────────────────────────────────── */

function ThemeSection() {
    const { t } = useTranslation();
    const preference = useThemeStore((state) => state.preference);
    const setPreference = useThemeStore((state) => state.setPreference);

    return (
        <View accessibilityRole="radiogroup">
            <SectionTitle>{t("settings.appearance.section")}</SectionTitle>
            <SectionCard>
                {THEME_OPTIONS.map((option, index) => (
                    <View key={option.value}>
                        {index > 0 && <SectionDivider />}
                        <OptionRow
                            icon={option.icon}
                            label={t(option.label)}
                            description={
                                option.description && t(option.description)
                            }
                            isSelected={preference === option.value}
                            onPress={() => setPreference(option.value)}
                        />
                    </View>
                ))}
            </SectionCard>
        </View>
    );
}

function LanguageSection() {
    const { t } = useTranslation();
    const preference = useLanguageStore((state) => state.preference);
    const setPreference = useLanguageStore((state) => state.setPreference);

    return (
        <View accessibilityRole="radiogroup">
            <SectionTitle>{t("settings.language.section")}</SectionTitle>
            <SectionCard>
                <OptionRow
                    icon={Globe}
                    label={t("settings.language.system")}
                    description={t("settings.language.systemDescription", {
                        language: LANGUAGE_NATIVE_NAMES[getSystemLanguage()],
                    })}
                    isSelected={preference === "system"}
                    onPress={() => setPreference("system")}
                />
                {SUPPORTED_LANGUAGES.map((language) => (
                    <View key={language}>
                        <SectionDivider />
                        {/* Cada idioma aparece escrito nele mesmo. */}
                        <OptionRow
                            icon={Languages}
                            label={LANGUAGE_NATIVE_NAMES[language]}
                            isSelected={preference === language}
                            onPress={() => setPreference(language)}
                        />
                    </View>
                ))}
            </SectionCard>
        </View>
    );
}

/**
 * "Excluir conta" fica por último, isolada na própria seção e em vermelho:
 * é destrutiva e rara, então não deve competir com as opções do dia a dia
 * nem ser tocada por engano. A confirmação acontece em uma tela dedicada,
 * que explica as consequências e pede a senha.
 */
function AccountSection({
    onDeleteAccountPress,
}: {
    onDeleteAccountPress: () => void;
}) {
    const { colors } = useAppTheme();
    const { t } = useTranslation();

    return (
        <View className="mt-4">
            <SectionTitle>{t("settings.account.section")}</SectionTitle>
            <SectionCard>
                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={t("settings.account.deleteAccount")}
                    accessibilityHint={t(
                        "settings.account.deleteAccountDescription",
                    )}
                    onPress={onDeleteAccountPress}
                    className="flex-row items-center justify-between px-5 py-4"
                    style={({ pressed }) => ({
                        backgroundColor: pressed
                            ? colors.errorContainer
                            : colors.surface,
                    })}
                >
                    <View className="flex-1 flex-row items-center gap-4 pr-3">
                        <View
                            className="h-8 w-8 items-center justify-center rounded-lg"
                            style={{ backgroundColor: colors.errorContainer }}
                        >
                            <Trash2 size={19} color={colors.error} strokeWidth={2} />
                        </View>
                        <View className="flex-1">
                            <Text
                                className="font-body-semibold text-base"
                                style={{ color: colors.error }}
                            >
                                {t("settings.account.deleteAccount")}
                            </Text>
                            <Text
                                className="font-body mt-0.5 text-[13px]"
                                style={{ color: colors.onSurfaceVariant }}
                            >
                                {t("settings.account.deleteAccountDescription")}
                            </Text>
                        </View>
                    </View>
                    <ChevronRight size={20} color={colors.outline} />
                </Pressable>
            </SectionCard>
        </View>
    );
}
