import {
    ArrowLeft,
    Bell,
    ChevronRight,
    History,
    Info,
    Settings,
    Shield,
    Trophy,
    User as UserIcon,
} from "lucide-react-native";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Pressable,
    ScrollView,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import { Text } from "@/components/ui/text";
import { useAuthStore } from "@/src/store/authStore";

// ─────────────────────────────────────────────────────────────
// TODO: Replace static gamification data with real API values
// once a gamification endpoint is available.
// ─────────────────────────────────────────────────────────────
const GAMIFICATION = {
    levelLabel: "Guardião",
    points: 850,
    progressPercent: 85,
    pointsToNext: 150,
    nextLevelLabel: "Guarda-Mor",
    currentLevelNumber: 2,
    nextLevelNumber: 3,
} as const;

const PRIMARY_HEX = "#0058BC";
const ERROR_HEX = "#BA1A1A";
const PAGE_BACKGROUND_HEX = "#F2F2F7";
const SURFACE_HEX = "#FFFFFF";
const SURFACE_TINT_HEX = "#F1F3FE";
const SURFACE_ICON_HEX = "#ECECF8";
const ON_SURFACE_HEX = "#181C23";
const ON_SURFACE_VARIANT_HEX = "#414755";

export default function ProfileScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { user, signOut } = useAuthStore();
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const handleLogout = async () => {
        setIsLoggingOut(true);
        try {
            await signOut();
            router.replace("/(auth)/login");
        } catch {
            Alert.alert(
                "Não foi possível sair",
                "Tente novamente em instantes.",
            );
        } finally {
            setIsLoggingOut(false);
        }
    };

    const initials =
        user?.name
            ?.split(" ")
            .map((n) => n[0])
            .slice(0, 2)
            .join("")
            .toUpperCase() ?? "?";

    return (
        <View className="flex-1" style={{ backgroundColor: PAGE_BACKGROUND_HEX }}>
            {/* ── Top App Bar ── */}
            <TopAppBar
                paddingTop={insets.top}
                onBack={() => router.back()}
            />

            {/* ── Main Content ── */}
            <ScrollView
                className="flex-1"
                contentContainerStyle={{
                    paddingBottom: insets.bottom + 100,
                    paddingHorizontal: 16,
                }}
                showsVerticalScrollIndicator={false}
            >
                <AvatarSection
                    initials={initials}
                    name={user?.name}
                    email={user?.email}
                />
                <LevelCard
                    levelLabel={GAMIFICATION.levelLabel}
                    points={GAMIFICATION.points}
                />
                <ProgressCard
                    currentLevel={GAMIFICATION.currentLevelNumber}
                    nextLevel={GAMIFICATION.nextLevelNumber}
                    levelLabel={GAMIFICATION.levelLabel}
                    pointsToNext={GAMIFICATION.pointsToNext}
                    nextLevelLabel={GAMIFICATION.nextLevelLabel}
                    progressPercent={GAMIFICATION.progressPercent}
                />
                <SettingsList />
                <LogoutSection
                    isLoggingOut={isLoggingOut}
                    onPress={handleLogout}
                />
            </ScrollView>
        </View>
    );
}

/* ═══════════════════════════════════════════════════════════════
   Sub-components
   ═══════════════════════════════════════════════════════════════ */

// ── Top App Bar ──────────────────────────────────────────────

type TopAppBarProps = {
    paddingTop: number;
    onBack: () => void;
};

function TopAppBar({ paddingTop, onBack }: TopAppBarProps) {
    return (
        <View
            className="flex-row items-center justify-between px-4"
            style={{
                backgroundColor: "#FFFFFF",
                paddingTop: paddingTop + 4,
                height: 56 + paddingTop,
            }}
        >
            <Pressable
                onPress={onBack}
                hitSlop={8}
            >
                <View className="h-11 w-11 items-center justify-center">
                    <ArrowLeft size={24} color={PRIMARY_HEX} strokeWidth={2} />
                </View>
            </Pressable>

            <Text
                className="text-lg font-semibold"
                style={{ color: ON_SURFACE_HEX }}
            >
                Profile
            </Text>

            <Pressable
                hitSlop={8}
                // TODO: Navigate to notifications when implemented
            >
                <View className="h-11 w-11 items-center justify-center">
                    <Bell size={24} color={PRIMARY_HEX} strokeWidth={2} />
                </View>
            </Pressable>
        </View>
    );
}

// ── Avatar Section ───────────────────────────────────────────

type AvatarSectionProps = {
    initials: string;
    name?: string;
    email?: string;
};

function AvatarSection({ initials, name, email }: AvatarSectionProps) {
    return (
        <View className="items-center justify-center pb-2 pt-5">
            <View
                className="h-24 w-24 items-center justify-center rounded-full"
                style={{
                    backgroundColor: "#E0E7F1",
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                    elevation: 3,
                }}
            >
                <UserIcon size={44} color="#7A8BA5" strokeWidth={1.6} />
            </View>

            <Text
                className="mt-3 text-[22px] font-bold leading-7"
                style={{ color: "#181C23" }}
            >
                {name ?? "Usuário"}
            </Text>

            <Text
                className="mt-1 text-[15px] leading-5"
                style={{ color: "#414755" }}
            >
                {email?.trim() || "—"}
            </Text>
        </View>
    );
}

// ── Level & Points Card ──────────────────────────────────────

type LevelCardProps = {
    levelLabel: string;
    points: number;
};

function LevelCard({ levelLabel, points }: LevelCardProps) {
    return (
        <View
            className="mt-5 flex-row items-center justify-between rounded-xl p-5"
            style={{
                backgroundColor: "#FFFFFF",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.08,
                shadowRadius: 12,
                elevation: 4,
            }}
        >
            {/* Left side: icon + label */}
            <View className="flex-row items-center gap-4">
                <View
                    className="h-12 w-12 items-center justify-center rounded-full"
                    style={{ backgroundColor: "#0070EB" }}
                >
                    <Shield
                        size={24}
                        color="#FFFFFF"
                        strokeWidth={2}
                        fill="#FFFFFF"
                    />
                </View>
                <View>
                    <Text
                        className="text-[11px] font-semibold uppercase tracking-widest"
                        style={{ color: "#414755" }}
                    >
                        Nível Atual
                    </Text>
                    <Text
                        className="text-xl font-semibold"
                        style={{ color: PRIMARY_HEX }}
                    >
                        {levelLabel}
                    </Text>
                </View>
            </View>

            {/* Right side: points */}
            <View className="items-end">
                <Text
                    className="text-[28px] font-bold leading-8"
                    style={{ color: "#181C23" }}
                >
                    {points}
                </Text>
                <Text
                    className="text-[13px] leading-5"
                    style={{ color: "#414755" }}
                >
                    pontos
                </Text>
            </View>
        </View>
    );
}


// ── Progress Card ────────────────────────────────────────────

type ProgressCardProps = {
    currentLevel: number;
    nextLevel: number;
    levelLabel: string;
    pointsToNext: number;
    nextLevelLabel: string;
    progressPercent: number;
};

function ProgressCard({
    currentLevel,
    nextLevel,
    levelLabel,
    pointsToNext,
    nextLevelLabel,
    progressPercent,
}: ProgressCardProps) {
    return (
        <View
            className="relative mt-4 overflow-hidden rounded-xl border p-6"
            style={{
                backgroundColor: SURFACE_TINT_HEX,
                borderColor: "#E1E5F1",
            }}
        >
            {/* Decorative watermark icon */}
            <View
                className="absolute opacity-10"
                style={{ right: -8, top: -8 }}
            >
                <Trophy size={100} color="#000" strokeWidth={1} />
            </View>

            {/* Content */}
            <View className="z-10">
                <Text
                    className="text-base font-semibold"
                    style={{ color: ON_SURFACE_HEX }}
                >
                    {`Progresso (Nível ${currentLevel} → ${nextLevel})`}
                </Text>

                <Text
                    className="mt-2 text-[13px] leading-5"
                    style={{ color: ON_SURFACE_VARIANT_HEX }}
                >
                    Você é um {levelLabel}. Apenas{" "}
                    <Text
                        className="font-bold"
                        style={{ color: PRIMARY_HEX }}
                    >
                        {pointsToNext} pontos
                    </Text>{" "}
                    para se tornar o {nextLevelLabel} e comandar a proteção da
                    comunidade!
                </Text>

                {/* Progress Bar */}
                <View
                    className="mt-5 h-2 overflow-hidden rounded-full"
                    style={{ backgroundColor: "#E2E4ED" }}
                >
                    <View
                        className="h-full rounded-full"
                        style={{
                            width: `${progressPercent}%`,
                            backgroundColor: PRIMARY_HEX,
                        }}
                    />
                </View>
            </View>
        </View>
    );
}


// ── Settings List ────────────────────────────────────────────

type SettingsRowProps = {
    icon: React.ComponentType<{
        size: number;
        color: string;
        strokeWidth: number;
    }>;
    label: string;
    onPress?: () => void;
};

function SettingsRow({ icon: Icon, label, onPress }: SettingsRowProps) {
    return (
        <Pressable
            onPress={onPress}
            className="flex-row items-center justify-between px-5 py-4"
            style={({ pressed }) => ({
                backgroundColor: pressed ? "#F7F8FC" : SURFACE_HEX,
            })}
        >
            <View className="flex-row items-center gap-4">
                <View
                    className="h-8 w-8 items-center justify-center rounded-lg"
                    style={{ backgroundColor: SURFACE_ICON_HEX }}
                >
                    <Icon size={20} color={PRIMARY_HEX} strokeWidth={2} />
                </View>
                <Text
                    className="text-base"
                    style={{ color: ON_SURFACE_HEX }}
                >
                    {label}
                </Text>
            </View>
            <ChevronRight size={20} color="#717786" strokeWidth={2} />
        </Pressable>
    );
}

function SettingsDivider() {
    return (
        <View
            className="h-px"
            style={{ marginLeft: 68, backgroundColor: "#F0F1F6" }}
        />
    );
}

function SettingsList() {
    return (
        <View
            className="mt-5 overflow-hidden rounded-xl"
            style={{
                backgroundColor: SURFACE_HEX,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 4,
                elevation: 2,
            }}
        >
            <SettingsRow icon={History} label="Meus Relatos" />
            <SettingsDivider />

            {/* TODO: Navigate to settings */}
            <SettingsRow icon={Settings} label="Configurações" />
            <SettingsDivider />

            {/* TODO: Navigate to about */}
            <SettingsRow icon={Info} label="Sobre o App" />
        </View>
    );
}

// ── Logout Section ───────────────────────────────────────────

type LogoutSectionProps = {
    isLoggingOut: boolean;
    onPress: () => void;
};

function LogoutSection({ isLoggingOut, onPress }: LogoutSectionProps) {
    return (
        <View
            className="mt-4 overflow-hidden rounded-xl"
            style={{
                backgroundColor: SURFACE_HEX,
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
                    backgroundColor: pressed ? "#FFF4F4" : SURFACE_HEX,
                })}
            >
                {isLoggingOut ? (
                    <ActivityIndicator size="small" color={ERROR_HEX} />
                ) : (
                    <Text
                        className="text-base font-semibold"
                        style={{ color: ERROR_HEX }}
                    >
                        Sair
                    </Text>
                )}
            </Pressable>
        </View>
    );
}
