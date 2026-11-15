import { useRouter } from "expo-router";
import {
    ArrowLeft,
    ChevronRight,
    Download,
    FileText,
    Mail,
    ShieldCheck,
    Trash2,
    type LucideIcon,
} from "lucide-react-native";
import { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Pressable,
    ScrollView,
    Share,
    TextInput,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Text } from "@/components/ui/text";
import { exportMyData, updateMyName } from "@/src/api/profile";
import { tr, useTranslation } from "@/src/i18n";
import { useAuthStore } from "@/src/store/authStore";
import { useAppTheme } from "@/src/theme/useAppTheme";

import { PRIVACY_CONTACT } from "../legalConfig";

const NAME_MIN = 2;
const NAME_MAX = 120;

/** "2026-11-15" → "15/11/2026". */
function formatVersion(version: string) {
    const [year, month, day] = version.split("-");
    return `${day}/${month}/${year}`;
}

/**
 * Direitos do titular (LGPD art. 18) reunidos em um só lugar: ler os textos
 * aceitos, corrigir o nome, exportar uma cópia dos dados e excluir a conta.
 */
export default function PrivacyDataScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { colors } = useAppTheme();
    const { t } = useTranslation();
    const user = useAuthStore((state) => state.user);

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
                    accessibilityLabel={t("legal.back")}
                    onPress={() => router.back()}
                    className="h-11 w-11 items-center justify-center"
                >
                    <ArrowLeft size={24} color={colors.primary} />
                </Pressable>
                <Text
                    accessibilityRole="header"
                    className="text-lg font-body-semibold"
                    style={{ color: colors.onSurface }}
                >
                    {t("privacyData.title")}
                </Text>
                <View className="h-11 w-11" />
            </View>

            <ScrollView
                contentContainerStyle={{
                    paddingHorizontal: 16,
                    paddingTop: 8,
                    paddingBottom: insets.bottom + 100,
                }}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                <SectionTitle>{t("privacyData.documentsSection")}</SectionTitle>
                <SectionCard>
                    <LinkRow
                        icon={FileText}
                        label={t("privacyData.terms")}
                        onPress={() => router.push("/legal/terms")}
                    />
                    <Divider />
                    <LinkRow
                        icon={ShieldCheck}
                        label={t("privacyData.privacy")}
                        onPress={() => router.push("/legal/privacy")}
                    />
                </SectionCard>
                {user?.terms_version ? (
                    <Text
                        className="font-body ml-4 mt-2 text-[13px]"
                        style={{ color: colors.onSurfaceVariant }}
                    >
                        {t("privacyData.acceptedOn", {
                            date: formatVersion(user.terms_version),
                        })}
                    </Text>
                ) : null}

                <SectionTitle>{t("privacyData.dataSection")}</SectionTitle>
                <SectionCard>
                    <NameEditor />
                    <Divider />
                    <ExportRow />
                </SectionCard>

                <SectionTitle>{t("privacyData.deleteSection")}</SectionTitle>
                <SectionCard>
                    <LinkRow
                        icon={Trash2}
                        label={t("settings.account.deleteAccount")}
                        description={t("settings.account.deleteAccountDescription")}
                        destructive
                        onPress={() => router.push("/profile/delete-account")}
                    />
                </SectionCard>

                <SectionTitle>{t("privacyData.contactSection")}</SectionTitle>
                <View className="gap-2 px-4">
                    {PRIVACY_CONTACT ? (
                        <View className="flex-row items-center gap-2">
                            <Mail size={16} color={colors.onSurfaceVariant} />
                            <Text
                                selectable
                                className="font-body flex-1 text-[14px]"
                                style={{ color: colors.onSurfaceVariant }}
                            >
                                {t("privacyData.contact", {
                                    contact: PRIVACY_CONTACT,
                                })}
                            </Text>
                        </View>
                    ) : null}
                    <Text
                        className="font-body text-[14px] leading-[21px]"
                        style={{ color: colors.onSurfaceVariant }}
                    >
                        {t("privacyData.anpd")}
                    </Text>
                </View>
            </ScrollView>
        </View>
    );
}

/* ── Corrigir o nome ─────────────────────────────────────────── */

function NameEditor() {
    const { colors } = useAppTheme();
    const { t } = useTranslation();
    const user = useAuthStore((state) => state.user);
    const setUser = useAuthStore((state) => state.setUser);
    const [name, setName] = useState(user?.name ?? "");
    const [status, setStatus] = useState<
        { type: "error" | "success"; message: string } | null
    >(null);
    const [isSaving, setIsSaving] = useState(false);

    const trimmed = name.trim();
    const isUnchanged = trimmed === (user?.name ?? "").trim();

    const handleSave = async () => {
        if (isSaving || isUnchanged) return;

        if (trimmed.length < NAME_MIN || trimmed.length > NAME_MAX) {
            setStatus({ type: "error", message: tr("privacyData.nameInvalid") });
            return;
        }

        setIsSaving(true);
        setStatus(null);
        try {
            const updated = await updateMyName(trimmed);
            setUser(updated);
            setName(updated.name);
            setStatus({ type: "success", message: tr("privacyData.saved") });
        } catch {
            setStatus({ type: "error", message: tr("privacyData.saveError") });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <View className="px-5 py-4">
            <Text
                nativeID="privacy-name-label"
                className="text-[14px] font-body-semibold"
                style={{ color: colors.onSurface }}
            >
                {t("privacyData.nameLabel")}
            </Text>
            <Text
                className="font-body mt-0.5 text-[13px]"
                style={{ color: colors.onSurfaceVariant }}
            >
                {t("privacyData.nameHint")}
            </Text>
            <View className="mt-3 flex-row items-center gap-2">
                <View
                    className="h-11 flex-1 justify-center rounded-xl border px-3"
                    style={{
                        backgroundColor: colors.surface,
                        borderColor:
                            status?.type === "error"
                                ? colors.error
                                : colors.outlineVariant,
                    }}
                >
                    <TextInput
                        accessibilityLabelledBy="privacy-name-label"
                        value={name}
                        onChangeText={(value) => {
                            setName(value);
                            if (status) setStatus(null);
                        }}
                        maxLength={NAME_MAX}
                        autoCapitalize="words"
                        autoComplete="name"
                        textContentType="name"
                        editable={!isSaving}
                        returnKeyType="done"
                        onSubmitEditing={() => void handleSave()}
                        className="font-body text-[15px]"
                        style={{ color: colors.onSurface }}
                    />
                </View>
                <Pressable
                    accessibilityRole="button"
                    accessibilityState={{ disabled: isUnchanged || isSaving }}
                    disabled={isUnchanged || isSaving}
                    onPress={() => void handleSave()}
                    className="h-11 min-w-[84px] items-center justify-center rounded-xl px-4"
                    style={{
                        backgroundColor: colors.primary,
                        opacity: isUnchanged || isSaving ? 0.5 : 1,
                    }}
                >
                    {isSaving ? (
                        <ActivityIndicator color={colors.onPrimary} />
                    ) : (
                        <Text
                            className="text-[15px] font-body-semibold"
                            style={{ color: colors.onPrimary }}
                        >
                            {t("privacyData.save")}
                        </Text>
                    )}
                </Pressable>
            </View>
            {status ? (
                <Text
                    accessibilityLiveRegion="polite"
                    className="font-body mt-2 text-[13px]"
                    style={{
                        color:
                            status.type === "error" ? colors.error : colors.success,
                    }}
                >
                    {status.message}
                </Text>
            ) : null}
        </View>
    );
}

/* ── Exportar os dados ───────────────────────────────────────── */

function ExportRow() {
    const { colors } = useAppTheme();
    const { t } = useTranslation();
    const [isExporting, setIsExporting] = useState(false);

    const handleExport = async () => {
        if (isExporting) return;
        setIsExporting(true);

        try {
            const data = await exportMyData();
            // O JSON vai pela folha de compartilhamento do sistema: o usuário
            // escolhe onde guardar (e-mail, notas, mensagens, arquivos).
            await Share.share({
                title: tr("privacyData.exportShareTitle"),
                message: JSON.stringify(data, null, 2),
            });
        } catch {
            Alert.alert(
                tr("privacyData.exportErrorTitle"),
                tr("privacyData.exportErrorMessage"),
            );
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <Pressable
            accessibilityRole="button"
            accessibilityState={{ busy: isExporting }}
            disabled={isExporting}
            onPress={() => void handleExport()}
            className="flex-row items-center justify-between px-5 py-4"
            style={({ pressed }) => ({
                backgroundColor: pressed ? colors.surfaceMuted : colors.surface,
            })}
        >
            <View className="flex-1 flex-row items-center gap-4 pr-3">
                <IconBox icon={Download} />
                <View className="flex-1">
                    <Text
                        className="font-body text-base"
                        style={{ color: colors.onSurface }}
                    >
                        {t("privacyData.export")}
                    </Text>
                    <Text
                        className="font-body mt-0.5 text-[13px]"
                        style={{ color: colors.onSurfaceVariant }}
                    >
                        {isExporting
                            ? t("privacyData.exporting")
                            : t("privacyData.exportDescription")}
                    </Text>
                </View>
            </View>
            {isExporting ? (
                <ActivityIndicator color={colors.primary} />
            ) : (
                <ChevronRight size={20} color={colors.outline} />
            )}
        </Pressable>
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

function Divider() {
    const { colors } = useAppTheme();

    return (
        <View
            className="h-px"
            style={{ marginLeft: 68, backgroundColor: colors.divider }}
        />
    );
}

function IconBox({
    icon: Icon,
    destructive = false,
}: {
    icon: LucideIcon;
    destructive?: boolean;
}) {
    const { colors } = useAppTheme();

    return (
        <View
            className="h-8 w-8 items-center justify-center rounded-lg"
            style={{
                backgroundColor: destructive
                    ? colors.errorContainer
                    : colors.surfaceMuted,
            }}
        >
            <Icon
                size={19}
                color={destructive ? colors.error : colors.primary}
                strokeWidth={2}
            />
        </View>
    );
}

function LinkRow({
    icon,
    label,
    description,
    destructive = false,
    onPress,
}: {
    icon: LucideIcon;
    label: string;
    description?: string;
    destructive?: boolean;
    onPress: () => void;
}) {
    const { colors } = useAppTheme();

    return (
        <Pressable
            accessibilityRole="button"
            onPress={onPress}
            className="flex-row items-center justify-between px-5 py-4"
            style={({ pressed }) => ({
                backgroundColor: pressed
                    ? destructive
                        ? colors.errorContainer
                        : colors.surfaceMuted
                    : colors.surface,
            })}
        >
            <View className="flex-1 flex-row items-center gap-4 pr-3">
                <IconBox icon={icon} destructive={destructive} />
                <View className="flex-1">
                    <Text
                        className={`text-base ${destructive ? "font-body-semibold" : "font-body"}`}
                        style={{ color: destructive ? colors.error : colors.onSurface }}
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
            <ChevronRight size={20} color={colors.outline} />
        </Pressable>
    );
}
