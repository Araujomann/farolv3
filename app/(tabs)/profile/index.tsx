import {
    ArrowLeft,
    Badge,
    BadgeCheck,
    Bell,
    ChevronRight,
    CircleAlert,
    History,
    Info,
    Settings,
    Shield,
    Sprout,
    Swords,
    User as UserIcon,
    X,
    type LucideIcon,
} from "lucide-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import * as Notifications from "expo-notifications";
import {
    ActivityIndicator,
    Animated,
    Alert,
    Modal,
    Pressable,
    ScrollView,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";

import { Text } from "@/components/ui/text";
import AboutScreen from "@/src/features/profile/components/AboutScreen";
import { getMyGamificationStats } from "@/src/api/profile";
import { ACCIDENT_APPROVED_EVENT } from "@/src/features/notifications/pushNotifications";
import { useAuthStore } from "@/src/store/authStore";
import { verifyEmailFromAppRoute } from "@/src/features/auth/verifyEmailRoute";
import { useProfileTitleColorStore } from "@/src/features/profile/titleColorStore";
import Reanimated, { useAnimatedStyle } from "react-native-reanimated";
import {
    TitleColorIcon,
    TitleColorText,
    useTitleColor,
} from "@/src/features/profile/components/TitleColor";
import { AdministrativeNoticesPanel } from "@/src/features/notifications/components/AdministrativeNoticesPanel";

const PRIMARY_HEX = "#0058BC";
const ERROR_HEX = "#BA1A1A";
const PAGE_BACKGROUND_HEX = "#F2F2F7";
const SURFACE_HEX = "#FFFFFF";
const SURFACE_ICON_HEX = "#ECECF8";
const ON_SURFACE_HEX = "#181C23";
const ON_SURFACE_VARIANT_HEX = "#414755";

const POINTS_PER_APPROVED_REPORT = 100;
const LEVELS = [
    {
        id: "user",
        label: "Usuário",
        minApprovedReports: 0,
        color: "#7A8494",
        icon: Sprout,
        message:
            "Seja bem-vindo à comunidade! Toda grande jornada começa com o primeiro passo. Contribua com seus primeiros 2 relatos aprovados e desperte como Guardião — o início da sua ascensão.",
    },
    {
        id: "guardian",
        label: "Guardião",
        minApprovedReports: 2,
        color: "#1769C2",
        icon: Shield,
        message:
            "Sua jornada começa a ganhar forma. A comunidade reconheceu seu valor e agora você é um Guardião. Ainda há um caminho a trilhar: conquiste mais 2 relatos aprovados e desperte como Guarda-mor.",
    },
    {
        id: "chief-guard",
        label: "Guarda-mor",
        minApprovedReports: 4,
        color: "#783DB5",
        icon: Swords,
        message:
            "Sua dedicação já inspira confiança. Você ascendeu a Guarda-mor — um pilar da comunidade. Falta pouco para o topo: com mais 2 relatos aprovados, você receberá o título de Chanceler.",
    },
    {
        id: "chancellor",
        label: "Chanceler",
        minApprovedReports: 6,
        color: "#84223D",
        icon: Badge,
        message:
            "Poucos chegam tão longe. Você agora é um Chanceler — a voz de autoridade e sabedoria da comunidade. Seu legado está selado. Continue zelando pela qualidade e inspire os novos a seguirem seus passos.",
    },
] as const;

type GamificationLevel = (typeof LEVELS)[number];

function getGamificationLevel(approvedReportsCount: number): GamificationLevel {
    return LEVELS.reduce<GamificationLevel>(
        (currentLevel, level) =>
            approvedReportsCount >= level.minApprovedReports
                ? level
                : currentLevel,
        LEVELS[0],
    );
}

export default function ProfileScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { user, signOut } = useAuthStore();
    const setTitleColor = useProfileTitleColorStore(
        (state) => state.setTitleColor,
    );
    const titleColor = useProfileTitleColorStore((state) => state.titleColor);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [isLogoutDialogVisible, setIsLogoutDialogVisible] = useState(false);
    const [isAboutVisible, setIsAboutVisible] = useState(false);
    const [isAdministrativeNoticesVisible, setIsAdministrativeNoticesVisible] =
        useState(false);
    const [approvedReportsCount, setApprovedReportsCount] = useState<
        number | null
    >(null);
    const [receivedTrustVotesCount, setReceivedTrustVotesCount] = useState<
        number | null
    >(null);
    const [isLoadingGamification, setIsLoadingGamification] = useState(true);
    const [gamificationError, setGamificationError] = useState<string | null>(
        null,
    );
    const gamificationRequestId = useRef(0);

    const loadGamification = useCallback(async () => {
        const requestId = ++gamificationRequestId.current;
        setIsLoadingGamification(true);
        setGamificationError(null);

        try {
            const {
                approved_reports_count: approvedCount,
                received_trust_votes_count: trustVotesCount,
            } = await getMyGamificationStats();
            if (
                !Number.isSafeInteger(approvedCount) ||
                approvedCount < 0 ||
                !Number.isSafeInteger(trustVotesCount) ||
                trustVotesCount < 0
            ) {
                throw new Error(
                    "A API retornou uma contagem inválida para sua progressão.",
                );
            }

            if (requestId === gamificationRequestId.current) {
                setApprovedReportsCount(approvedCount);
                setReceivedTrustVotesCount(trustVotesCount);
            }
        } catch (error) {
            if (__DEV__) {
                console.warn(
                    "Falha ao carregar a progressão do perfil",
                    error,
                );
            }
            if (requestId === gamificationRequestId.current) {
                setGamificationError(
                    "Não foi possível carregar sua progressão. Verifique a conexão e tente novamente.",
                );
            }
        } finally {
            if (requestId === gamificationRequestId.current) {
                setIsLoadingGamification(false);
            }
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            void loadGamification();
            const subscription =
                Notifications.addNotificationReceivedListener(
                    (notification) => {
                        const { type, accidentId } =
                            notification.request.content.data;
                        if (
                            type === ACCIDENT_APPROVED_EVENT &&
                            typeof accidentId === "string"
                        ) {
                            void loadGamification();
                        }
                    },
                );

            return () => {
                gamificationRequestId.current += 1;
                subscription.remove();
            };
        }, [loadGamification]),
    );

    const handleLogout = async () => {
        setIsLoggingOut(true);
        try {
            await signOut();
            setIsLogoutDialogVisible(false);
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

    const level = getGamificationLevel(approvedReportsCount ?? 0);
    const hasLoadedLevel = approvedReportsCount !== null;
    useEffect(() => {
        // Só aplica a cor quando o nível real é conhecido, evitando uma
        // transição intermediária para a cor do nível inicial.
        if (hasLoadedLevel) {
            setTitleColor(level.color);
        }
    }, [hasLoadedLevel, level.color, setTitleColor]);

    const levelIndex = LEVELS.findIndex(
        (candidate) => candidate.id === level.id,
    );
    const nextLevel = LEVELS[levelIndex + 1];
    const progressPercent =
        approvedReportsCount === null || !nextLevel
            ? 100
            : Math.min(
                  100,
                  Math.max(
                      0,
                      (approvedReportsCount / nextLevel.minApprovedReports) * 100,
                  ),
              );

    return (
        <View className="flex-1" style={{ backgroundColor: PAGE_BACKGROUND_HEX }}>
            {/* ── Top App Bar ── */}
            <TopAppBar
                paddingTop={insets.top}
                onBack={() => router.back()}
                onNoticesPress={() => setIsAdministrativeNoticesVisible(true)}
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
                    name={user?.name}
                    email={user?.email}
                    level={level}
                    is_email_verified={user?.is_email_verified}
                    onVerifyEmail={() => router.push(verifyEmailFromAppRoute)}
                />
                {isLoadingGamification && (
                    <GamificationLoading />
                )}
                {gamificationError && (
                    <GamificationError
                        message={gamificationError}
                        onRetry={() => void loadGamification()}
                    />
                )}
                {approvedReportsCount !== null && (
                    <>
                        <LevelCard
                            level={level}
                            approvedReportsCount={approvedReportsCount}
                            points={
                                approvedReportsCount *
                                POINTS_PER_APPROVED_REPORT
                            }
                        />
                        <ProgressCard
                            level={level}
                            nextLevel={nextLevel}
                            progressPercent={progressPercent}
                        />
                        {receivedTrustVotesCount !== null && (
                            <TrustVotesCard count={receivedTrustVotesCount} />
                        )}
                    </>
                )}
                <SettingsList
                    onReportsPress={() => router.push("/profile/reports")}
                    onAboutPress={() => setIsAboutVisible(true)}
                />
                <LogoutSection
                    isLoggingOut={isLoggingOut}
                    onPress={() => setIsLogoutDialogVisible(true)}
                />
            </ScrollView>

            <Modal
                visible={isAboutVisible}
                animationType="slide"
                presentationStyle="fullScreen"
                onRequestClose={() => setIsAboutVisible(false)}
            >
                <AboutScreen onClose={() => setIsAboutVisible(false)} />
            </Modal>

            <Modal
                visible={isLogoutDialogVisible}
                transparent
                animationType="fade"
                statusBarTranslucent
                navigationBarTranslucent
                onRequestClose={() => setIsLogoutDialogVisible(false)}
            >
                <View className="flex-1 items-center justify-center bg-black/45 px-5">
                    <View className="w-full max-w-[390px] rounded-[28px] bg-white p-5 shadow-2xl">
                        <View className="mb-5 flex-row items-start justify-between">
                            <View className="flex-1 flex-row items-center gap-3 pr-4">
                                <View className="h-11 w-11 items-center justify-center rounded-full bg-[#FFF1E8]">
                                    <CircleAlert
                                        size={24}
                                        color="#C64F00"
                                        strokeWidth={2.25}
                                    />
                                </View>
                                <Text className="flex-1 text-[20px] font-display" style={{ color: ON_SURFACE_HEX }}>
                                    Sair da conta?
                                </Text>
                            </View>
                            <Pressable
                                accessibilityLabel="Fechar confirmação"
                                onPress={() => setIsLogoutDialogVisible(false)}
                                disabled={isLoggingOut}
                                className="h-9 w-9 items-center justify-center rounded-full bg-[#F1F3FE]"
                            >
                                <X size={18} color={ON_SURFACE_VARIANT_HEX} />
                            </Pressable>
                        </View>

                        <Text
                            className="font-body mb-6 text-[15px] leading-[21px]"
                            style={{ color: ON_SURFACE_VARIANT_HEX }}
                        >
                            Você precisará entrar novamente para acessar sua conta. Deseja sair mesmo assim?
                        </Text>

                        <View className="gap-2.5">
                            <Pressable
                                accessibilityLabel="Continuar conectado"
                                onPress={() => setIsLogoutDialogVisible(false)}
                                disabled={isLoggingOut}
                                className="h-12 items-center justify-center rounded-xl bg-[#0058BC]"
                            >
                                <Text className="text-[15px] font-body-bold text-white">
                                    Continuar conectado
                                </Text>
                            </Pressable>
                            <Pressable
                                accessibilityLabel="Sair da conta"
                                onPress={handleLogout}
                                disabled={isLoggingOut}
                                className="h-12 items-center justify-center rounded-xl border border-[#F0B7A8] bg-[#FFF8F5]"
                            >
                                {isLoggingOut ? (
                                    <ActivityIndicator size="small" color={ERROR_HEX} />
                                ) : (
                                    <Text
                                        className="text-[15px] font-body-bold"
                                        style={{ color: ERROR_HEX }}
                                    >
                                        Sair da conta
                                    </Text>
                                )}
                            </Pressable>
                        </View>
                    </View>
                </View>
            </Modal>

            <AdministrativeNoticesPanel
                isVisible={isAdministrativeNoticesVisible}
                onClose={() => setIsAdministrativeNoticesVisible(false)}
                titleColor={titleColor}
            />
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
    onNoticesPress: () => void;
};

function TopAppBar({
    paddingTop,
    onBack,
    onNoticesPress,
}: TopAppBarProps) {
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
                    <TitleColorIcon
                        icon={ArrowLeft}
                        size={24}
                        strokeWidth={2}
                    />
                </View>
            </Pressable>

            <Text
                className="text-lg font-body-semibold"
                style={{ color: ON_SURFACE_HEX }}
            >
                Profile
            </Text>

            <Pressable
                accessibilityLabel="Avisos administrativos"
                accessibilityRole="button"
                hitSlop={8}
                onPress={onNoticesPress}
            >
                <View className="h-11 w-11 items-center justify-center">
                    <TitleColorIcon
                        icon={Bell}
                        size={24}
                        strokeWidth={2}
                    />
                </View>
            </Pressable>
        </View>
    );
}

// ── Avatar Section ───────────────────────────────────────────

type AvatarSectionProps = {
    name?: string;
    email?: string;
    level: GamificationLevel;
    is_email_verified?: boolean;
    onVerifyEmail: () => void;
};

function AvatarSection({ name, email, level, is_email_verified, onVerifyEmail }: AvatarSectionProps) {
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const opacityAnim = useRef(new Animated.Value(1)).current;
    const titleColor = useTitleColor();
    const borderStyle = useAnimatedStyle(() => ({
        borderColor: titleColor.value,
    }));

    useEffect(() => {
        Animated.parallel([
            Animated.timing(scaleAnim, {
                toValue: is_email_verified ? 1 : 1,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.timing(opacityAnim, {
                toValue: is_email_verified ? 1 : 1,
                duration: 300,
                useNativeDriver: true,
            }),
        ]).start();
    }, [is_email_verified, scaleAnim, opacityAnim]);

    return (
        <View className="items-center justify-center pb-2 pt-5">
            <Animated.View
                accessibilityLabel={`Avatar com destaque do nível ${level.label}`}
                className="h-[112px] w-[112px] items-center justify-center rounded-full border-[3px] p-[4px] relative"
                style={{
                    borderColor: "transparent",
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                    elevation: 3,
                    transform: [{ scale: scaleAnim }],
                    opacity: opacityAnim,
                }}
            >
                {/* Anel com a cor do título (animado na thread de UI) */}
                <Reanimated.View
                    pointerEvents="none"
                    style={[
                        {
                            position: "absolute",
                            top: -3,
                            right: -3,
                            bottom: -3,
                            left: -3,
                            borderRadius: 999,
                            borderWidth: 3,
                        },
                        borderStyle,
                    ]}
                />
                <View className="h-full w-full items-center justify-center rounded-full bg-[#E0E7F1]">
                    <UserIcon size={44} color="#7A8BA5" strokeWidth={1.6} />
                </View>
                
                {/* Verificação de e-mail badge */}
                {!is_email_verified && (
                    <Animated.View 
                        className="absolute bottom-0 right-0 h-6 w-6 items-center justify-center rounded-full bg-red-500 border-2 border-white"
                        accessibilityLabel="E-mail não verificado"
                        style={{
                            transform: [{ scale: scaleAnim }],
                            opacity: opacityAnim,
                        }}
                    >
                        <CircleAlert size={12} color="#FFFFFF" strokeWidth={1.5} />
                    </Animated.View>
                )}
            </Animated.View>

            <Text
                className="mt-3 text-[22px] font-display leading-7"
                style={{ color: "#181C23" }}
            >
                {name ?? "Usuário"}
            </Text>

            <View className="flex-row items-center gap-2 mt-1">
                <Text
                    className="font-body text-[15px] leading-5"
                    style={{ color: "#414755" }}
                >
                    {email?.trim() || "—"}
                </Text>
                {!is_email_verified && (
                    <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="E-mail não verificado. Verificar agora"
                        onPress={onVerifyEmail}
                        hitSlop={8}
                    >
                        <Text
                            className="text-[12px] font-body-semibold underline"
                            style={{ color: "#F59E0B" }}
                        >
                            Não verificado · Verificar
                        </Text>
                    </Pressable>
                )}
            </View>
        </View>
    );
}

// ── Level & Points Card ──────────────────────────────────────

type LevelCardProps = {
    level: GamificationLevel;
    approvedReportsCount: number;
    points: number;
};

/** Borda translúcida na cor do título, animada na thread de UI. */
function useTitleBorderStyle() {
    const titleColor = useTitleColor();
    return useAnimatedStyle(() => ({
        borderColor: `${titleColor.value}44`,
    }));
}

/** Fundo na cor do título, animado na thread de UI. */
function useTitleBackgroundStyle() {
    const titleColor = useTitleColor();
    return useAnimatedStyle(() => ({
        backgroundColor: titleColor.value,
    }));
}

function LevelCard({ level, approvedReportsCount, points }: LevelCardProps) {
    const LevelIcon = level.icon;
    const borderStyle = useTitleBorderStyle();
    const iconBackgroundStyle = useTitleBackgroundStyle();

    return (
        <Reanimated.View
            className="mt-5 flex-row items-center gap-3 rounded-xl border p-6"
            style={[
                {
                    backgroundColor: "#FFFFFF",
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.08,
                    shadowRadius: 12,
                    elevation: 4,
                },
                borderStyle,
            ]}
        >
            {/* Left side: icon + label */}
            <View className="min-w-0 flex-1 flex-row items-center gap-3">
                <Reanimated.View
                    className="h-12 w-12 items-center justify-center rounded-full"
                    style={iconBackgroundStyle}
                >
                    <LevelIcon
                        size={24}
                        color="#FFFFFF"
                        strokeWidth={2}
                    />
                </Reanimated.View>
                <View className="min-w-0 flex-1">
                    <Text
                        className="text-[11px] font-body-semibold uppercase tracking-widest"
                        style={{ color: "#414755" }}
                    >
                        Nível Atual
                    </Text>
                    <TitleColorText
                        className="text-xl font-display-semibold"
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.8}
                    >
                        {level.label}
                    </TitleColorText>
                    <Text
                        className="font-body mt-0.5 text-xs"
                        style={{ color: ON_SURFACE_VARIANT_HEX }}
                    >
                        {approvedReportsCount}{" "}
                        {approvedReportsCount === 1
                            ? "relato aprovado"
                            : "relatos aprovados"}
                    </Text>
                </View>
            </View>

            {/* Right side: points */}
            <View className="max-w-[38%] shrink-0 items-end">
                <Text
                    className="text-[24px] font-display leading-8"
                    style={{ color: "#181C23" }}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.7}
                >
                    {points.toLocaleString("pt-BR")}
                </Text>
                <Text
                    className="font-body text-[13px] leading-5"
                    style={{ color: "#414755" }}
                >
                    pontos
                </Text>
            </View>
        </Reanimated.View>
    );
}


// ── Progress Card ────────────────────────────────────────────

type ProgressCardProps = {
    level: GamificationLevel;
    nextLevel: GamificationLevel | undefined;
    progressPercent: number;
};

function ProgressCard({
    level,
    nextLevel,
    progressPercent,
}: ProgressCardProps) {
    const progress = useRef(new Animated.Value(0)).current;
    const LevelIcon = level.icon;
    const borderStyle = useTitleBorderStyle();
    const barColorStyle = useTitleBackgroundStyle();

    useEffect(() => {
        const animation = Animated.timing(progress, {
            toValue: progressPercent,
            duration: 700,
            useNativeDriver: false,
        });
        animation.start();

        return () => animation.stop();
    }, [progress, progressPercent]);

    return (
        <Reanimated.View
            className="relative mt-4 overflow-hidden rounded-xl border p-6"
            style={[{ backgroundColor: SURFACE_HEX }, borderStyle]}
        >
            {/* Decorative watermark icon */}
            <View
                className="absolute opacity-10"
                style={{ right: -8, top: -8 }}
            >
                <TitleColorIcon icon={LevelIcon} size={100} strokeWidth={1} />
            </View>

            {/* Content */}
            <View className="z-10">
                <Text
                    className="text-base font-body-semibold"
                    style={{ color: ON_SURFACE_HEX }}
                >
                    {nextLevel
                        ? `Progresso: ${level.label} → ${nextLevel.label}`
                        : "Nível máximo alcançado"}
                </Text>

                <Text
                    className="font-body mt-2 text-[13px] leading-5"
                    style={{ color: ON_SURFACE_VARIANT_HEX }}
                >
                    {level.message}
                </Text>

                {/* Progress Bar */}
                <View
                    className="mt-5 h-2.5 overflow-hidden rounded-full"
                    style={{ backgroundColor: "#E2E4ED" }}
                >
                    <Animated.View
                        className="h-full overflow-hidden rounded-full"
                        style={{
                            width: progress.interpolate({
                                inputRange: [0, 100],
                                outputRange: ["0%", "100%"],
                            }),
                        }}
                    >
                        <Reanimated.View
                            className="h-full w-full"
                            style={barColorStyle}
                        />
                    </Animated.View>
                </View>
                <TitleColorText className="mt-2 text-right text-xs font-body-semibold">
                    {`${Math.round(progressPercent)}%`}
                </TitleColorText>
            </View>
        </Reanimated.View>
    );
}

function TrustVotesCard({ count }: { count: number }) {
    return (
        <View className="mt-4 flex-row items-center gap-4 rounded-xl border border-[#D8E2FF] bg-white p-5">
            <View className="h-12 w-12 items-center justify-center rounded-full bg-[#EAF1FF]">
                <TitleColorIcon
                    icon={BadgeCheck}
                    size={25}
                    strokeWidth={2.2}
                />
            </View>
            <View className="flex-1">
                <Text
                    className="text-base font-body-semibold"
                    style={{ color: ON_SURFACE_HEX }}
                >
                    Selos de confiança
                </Text>
                <Text
                    className="font-body mt-1 text-[13px]"
                    style={{ color: ON_SURFACE_VARIANT_HEX }}
                >
                    {count === 1
                        ? "1 voto confiável recebido"
                        : `${count} votos confiáveis recebidos`}
                </Text>
            </View>
            <TitleColorText className="text-2xl font-display">
                {count}
            </TitleColorText>
        </View>
    );
}

function GamificationLoading() {
    return (
        <View className="mt-5 flex-row items-center justify-center gap-2 rounded-xl bg-white p-4">
            <ActivityIndicator size="small" color={PRIMARY_HEX} />
            <Text className="font-body text-sm" style={{ color: ON_SURFACE_VARIANT_HEX }}>
                Atualizando sua progressão...
            </Text>
        </View>
    );
}

type GamificationErrorProps = {
    message: string;
    onRetry: () => void;
};

function GamificationError({ message, onRetry }: GamificationErrorProps) {
    return (
        <View className="mt-4 rounded-xl border border-[#F0B7A8] bg-[#FFF8F5] p-4">
            <Text className="font-body text-sm" style={{ color: ERROR_HEX }}>
                {message}
            </Text>
            <Pressable
                accessibilityRole="button"
                onPress={onRetry}
                className="mt-3 self-start rounded-lg bg-white px-3 py-2"
            >
                <Text className="text-sm font-body-semibold" style={{ color: ERROR_HEX }}>
                    Tentar novamente
                </Text>
            </Pressable>
        </View>
    );
}


// ── Settings List ────────────────────────────────────────────

type SettingsRowProps = {
    icon: LucideIcon;
    label: string;
    onPress?: () => void;
};

function SettingsRow({
    icon: Icon,
    label,
    onPress,
}: SettingsRowProps) {
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
                    <TitleColorIcon icon={Icon} size={20} strokeWidth={2} />
                </View>
                <Text
                    className="font-body text-base"
                    style={{ color: ON_SURFACE_HEX }}
                >
                    {label}
                </Text>
            </View>
            <TitleColorIcon icon={ChevronRight} size={20} strokeWidth={2} />
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

function SettingsList({
    onReportsPress,
    onAboutPress,
}: {
    onReportsPress: () => void;
    onAboutPress: () => void;
}) {
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
            <SettingsRow
                icon={History}
                label="Meus Relatos"
                onPress={onReportsPress}
            />
            <SettingsDivider />

            {/* TODO: Navigate to settings */}
            <SettingsRow
                icon={Settings}
                label="Configurações"
            />
            <SettingsDivider />

            <SettingsRow
                icon={Info}
                label="Sobre o App"
                onPress={onAboutPress}
            />
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
                        className="text-base font-body-semibold"
                        style={{ color: ERROR_HEX }}
                    >
                        Sair
                    </Text>
                )}
            </Pressable>
        </View>
    );
}
