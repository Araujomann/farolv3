import { Text } from "@/components/ui/text";
import { getAccidentOverview } from "@/src/api/accidents";
import type { AccidentOverview, AccidentSeverity } from "@/src/api/accidents";
import { getMyGamificationStats } from "@/src/api/profile";
import type { GamificationStats } from "@/src/api/profile";
import { ACCIDENT_APPROVED_EVENT } from "@/src/features/notifications/pushNotifications";
import { useAuthStore } from "@/src/store/authStore";
import { verifyEmailFromAppRoute } from "@/src/features/auth/verifyEmailRoute";
import { useFocusEffect, useRouter } from "expo-router";
import * as Notifications from "expo-notifications";
import {
    Activity,
    ArrowDownRight,
    ArrowUpRight,
    Car,
    ChevronRight,
    Clock3,
    Mail,
    MapPin,
    RefreshCw,
    Shield,
    ShieldAlert,
    ShieldCheck,
    TrendingUp,
    Users,
} from "lucide-react-native";
import { useCallback, useRef, useState } from "react";
import {
    ActivityIndicator,
    Image,
    Pressable,
    RefreshControl,
    ScrollView,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAppTheme } from "@/src/theme/useAppTheme";
import {
    formatNumber,
    formatRelativeTime,
    translateAccidentType,
    useTranslation,
} from "@/src/i18n";
import { SEVERITY_COLORS } from "@/src/theme/colors";
function useHomeColors() {
    const { colors } = useAppTheme();
    return {
    primary: colors.primary,
    background: colors.background,
    surface: colors.surface,
    surfaceIcon: colors.surfaceMuted,
    text: colors.onSurface,
    secondaryText: colors.onSurfaceVariant,
    border: colors.outlineVariant,
    positive: "#238636",
    positiveBackground: colors.successContainer,
    negative: colors.error,
    negativeBackground: colors.errorContainer,
    severity: SEVERITY_COLORS,
    };
}


/** Ao voltar para a aba, só recarrega se os dados tiverem mais que isso. */
const FOCUS_REFRESH_INTERVAL_MS = 30_000;

const CARD_SHADOW = {
    elevation: 2,
    shadowColor: "#202A44",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
};


function validateOverview(overview: AccidentOverview) {
    const counts = [
        overview.approved_accidents_count,
        overview.accidents_with_victims_count,
        overview.high_severity_accidents_count,
        overview.current_30_days_count,
        overview.previous_30_days_count,
        ...Object.values(overview.severity_distribution),
        ...overview.time_of_day.map((period) => period.count),
    ];

    if (
        counts.some(
            (count) => !Number.isSafeInteger(count) || count < 0,
        ) ||
        overview.time_of_day.length !== 8
    ) {
        throw new Error("A API retornou estatísticas inválidas.");
    }
}

function validatePersonalStats(stats: GamificationStats) {
    if (
        !Number.isSafeInteger(stats.approved_reports_count) ||
        stats.approved_reports_count < 0 ||
        !Number.isSafeInteger(stats.received_trust_votes_count) ||
        stats.received_trust_votes_count < 0
    ) {
        throw new Error("A API retornou estatísticas pessoais inválidas.");
    }
}

function MetricCard({
    icon: Icon,
    label,
    value,
    detail,
}: {
    icon: typeof Car;
    label: string;
    value: number;
    detail: string;
}) {
    const COLORS = useHomeColors();
    return (
        <View
            className="min-h-[150px] flex-1 rounded-3xl bg-white dark:bg-[#1A1D24] p-4"
            style={CARD_SHADOW}
        >
            <View
                className="mb-3 h-10 w-10 items-center justify-center rounded-full"
                style={{ backgroundColor: COLORS.surfaceIcon }}
            >
                <Icon size={21} color={COLORS.primary} strokeWidth={2.2} />
            </View>
            <Text
                className="text-[26px] font-display leading-8"
                style={{ color: COLORS.text }}
            >
                {formatNumber(value)}
            </Text>
            <Text
                className="mt-0.5 text-sm font-body-semibold"
                style={{ color: COLORS.text }}
            >
                {label}
            </Text>
            <Text
                className="font-body mt-1 text-xs leading-4"
                style={{ color: COLORS.secondaryText }}
            >
                {detail}
            </Text>
        </View>
    );
}

function TrendCard({
    currentCount,
    previousCount,
}: {
    currentCount: number;
    previousCount: number;
}) {
    const { t } = useTranslation();
    const COLORS = useHomeColors();
    const change =
        previousCount === 0
            ? null
            : Math.round(
                  ((currentCount - previousCount) / previousCount) * 100,
              );
    const isIncrease = change !== null && change > 0;
    const isDecrease = change !== null && change < 0;
    const changeColor = isIncrease
        ? COLORS.negative
        : isDecrease
          ? COLORS.positive
          : COLORS.secondaryText;
    const changeBackground = isIncrease
        ? COLORS.negativeBackground
        : isDecrease
          ? COLORS.positiveBackground
          : COLORS.surfaceIcon;
    const TrendIcon = isIncrease
        ? ArrowUpRight
        : isDecrease
          ? ArrowDownRight
          : Activity;
    const changeLabel =
        change === null
            ? currentCount > 0
                ? t("home.newRecords")
                : t("home.noRecords")
            : `${change > 0 ? "+" : ""}${change}%`;

}

function TimeOfDayCard({
    periods,
}: {
    periods: AccidentOverview["time_of_day"];
}) {
    const { t } = useTranslation();
    const COLORS = useHomeColors();
    const maxCount = Math.max(1, ...periods.map((period) => period.count));

    return (
        <View
            className="rounded-3xl bg-white dark:bg-[#1A1D24] p-4"
            style={CARD_SHADOW}
        >
            <View className="flex-row items-center">
                <Clock3 size={21} color={COLORS.primary} strokeWidth={2.2} />
                <Text
                    className="ml-2 flex-1 text-base font-body-bold"
                    style={{ color: COLORS.text }}
                >
                    {t("home.byTimeOfDay")}
                </Text>
                <Text
                    className="font-body text-xs"
                    style={{ color: COLORS.secondaryText }}
                >
                    {t("home.last30Days")}
                </Text>
            </View>
            <View className="mt-5 h-[134px] flex-row items-end justify-between">
                {periods.map((period) => {
                    const height =
                        period.count === 0
                            ? 3
                            : Math.max(10, (period.count / maxCount) * 96);

                    return (
                        <View
                            key={period.start_hour}
                            className="flex-1 items-center justify-end"
                        >
                            {period.count > 0 ? (
                                <Text
                                    className="mb-1 text-[10px] font-body-semibold"
                                    style={{ color: COLORS.secondaryText }}
                                >
                                    {formatNumber(period.count)}
                                </Text>
                            ) : (
                                <View className="mb-1 h-3" />
                            )}
                            <View
                                className="w-5 rounded-t-md"
                                style={{
                                    height,
                                    backgroundColor: COLORS.primary,
                                    opacity: period.count === 0 ? 0.2 : 0.88,
                                }}
                            />
                            <Text
                                className="font-body mt-2 text-[9px]"
                                style={{ color: COLORS.secondaryText }}
                            >
                                {`${String(period.start_hour).padStart(2, "0")}–${String(
                                    period.start_hour + 3,
                                ).padStart(2, "0")}`}
                            </Text>
                        </View>
                    );
                })}
            </View>
        </View>
    );
}

function SeverityCard({
    overview,
}: {
    overview: AccidentOverview;
}) {
    const { t } = useTranslation();
    const COLORS = useHomeColors();
    const total = overview.approved_accidents_count;
    const severities: AccidentSeverity[] = [
        "low",
        "medium",
        "high",
        "critical",
    ];

    return (
        <View
            className="rounded-3xl bg-white dark:bg-[#1A1D24] p-4"
            style={CARD_SHADOW}
        >
            <View className="mb-4 flex-row items-center">
                <ShieldAlert
                    size={21}
                    color={COLORS.primary}
                    strokeWidth={2.2}
                />
                <View className="ml-2 flex-1">
                    <Text
                        className="text-base font-body-bold"
                        style={{ color: COLORS.text }}
                    >
                        {t("home.severityTitle")}
                    </Text>
                    <Text
                        className="font-body mt-0.5 text-xs"
                        style={{ color: COLORS.secondaryText }}
                    >
                        {t("home.severitySubtitle")}
                    </Text>
                </View>
            </View>
            <View className="gap-3">
                {severities.map((severity) => {
                    const count = overview.severity_distribution[severity];
                    const percentage =
                        total > 0 ? Math.round((count / total) * 100) : 0;

                    return (
                        <View key={severity}>
                            <View className="mb-1 flex-row items-center justify-between">
                                <Text
                                    className="font-body text-sm"
                                    style={{ color: COLORS.text }}
                                >
                                    {t(`enums.severity.${severity}`)}
                                </Text>
                                <Text
                                    className="text-xs font-body-semibold"
                                    style={{ color: COLORS.secondaryText }}
                                >
                                    {formatNumber(count)} · {percentage}%
                                </Text>
                            </View>
                            <View className="h-2 overflow-hidden rounded-full bg-[#EEF0F5] dark:bg-[#242833]">
                                <View
                                    className="h-full rounded-full"
                                    style={{
                                        width: `${percentage}%`,
                                        backgroundColor: COLORS.severity[severity],
                                    }}
                                />
                            </View>
                        </View>
                    );
                })}
            </View>
        </View>
    );
}

function CommunityError({
    message,
    onRetry,
}: {
    message: string;
    onRetry: () => void;
}) {
    const { t } = useTranslation();
    const COLORS = useHomeColors();
    return (
        <View
            className="items-center rounded-3xl bg-white dark:bg-[#1A1D24] px-5 py-7"
            style={CARD_SHADOW}
        >
            <Activity size={25} color={COLORS.primary} />
            <Text
                className="mt-3 text-center text-base font-body-semibold"
                style={{ color: COLORS.text }}
            >
                {t("home.overviewError")}
            </Text>
            <Text
                className="font-body mt-1 text-center text-sm leading-5"
                style={{ color: COLORS.secondaryText }}
            >
                {message}
            </Text>
            <Pressable
                accessibilityRole="button"
                onPress={onRetry}
                className="mt-4 flex-row items-center rounded-xl px-4 py-2"
                style={{ backgroundColor: COLORS.surfaceIcon }}
            >
                <RefreshCw size={15} color={COLORS.primary} />
                <Text
                    className="ml-2 text-sm font-body-semibold"
                    style={{ color: COLORS.primary }}
                >
                    {t("common.retry")}
                </Text>
            </Pressable>
        </View>
    );
}

function RecentAccidentsCard({
    overview,
    onAccidentPress,
    onOpenMap,
}: {
    overview: AccidentOverview;
    onAccidentPress: (accidentId: string) => void;
    onOpenMap: () => void;
}) {
    const { t } = useTranslation();
    const COLORS = useHomeColors();
    return (
        <View
            className="rounded-3xl bg-white dark:bg-[#1A1D24] p-4"
            style={CARD_SHADOW}
        >
            <View className="mb-2 flex-row items-center">
                <Text
                    className="flex-1 text-base font-body-bold"
                    style={{ color: COLORS.text }}
                >
                    {t("home.recentAccidents")}
                </Text>
                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={t("home.openMap")}
                    onPress={onOpenMap}
                    className="h-9 w-9 items-center justify-center rounded-full"
                    style={{ backgroundColor: COLORS.surfaceIcon }}
                >
                    <ChevronRight size={19} color={COLORS.primary} />
                </Pressable>
            </View>
            {overview.recent_accidents.length === 0 ? (
                <Text
                    className="font-body py-4 text-sm"
                    style={{ color: COLORS.secondaryText }}
                >
                    {t("home.noRecentAccidents")}
                </Text>
            ) : (
                overview.recent_accidents.map((accident, index) => (
                    <Pressable
                        key={accident.id}
                        accessibilityRole="button"
                        onPress={() => onAccidentPress(accident.id)}
                        className="flex-row items-center py-3"
                        style={{
                            borderTopWidth: index === 0 ? 0 : 1,
                            borderTopColor: COLORS.border,
                        }}
                    >
                        <View
                            className="mr-3 h-11 w-11 items-center justify-center rounded-full"
                            style={{ backgroundColor: COLORS.surfaceIcon }}
                        >
                            <Car
                                size={21}
                                color={COLORS.primary}
                                strokeWidth={2.2}
                            />
                        </View>
                        <View className="mr-2 flex-1">
                            <Text
                                numberOfLines={1}
                                className="text-sm font-body-bold"
                                style={{ color: COLORS.text }}
                            >
                                {translateAccidentType(accident.tipo_acidente)}
                            </Text>
                            <Text
                                numberOfLines={1}
                                className="font-body mt-0.5 text-xs"
                                style={{ color: COLORS.secondaryText }}
                            >
                                {t(
                                    `enums.classification.${accident.classificacao_acidente}`,
                                )}
                                {" · "}
                                {formatRelativeTime(accident.occurred_at)}
                            </Text>
                        </View>
                        <View
                            className="rounded-4xl px-2.5 py-1"
                            style={{ backgroundColor: COLORS.severity[accident.severity as keyof typeof COLORS.severity] }}
                        >
                    </View>
                    </Pressable>
                ))
            )}
        </View>
    );
}

function PersonalContribution({
    stats,
    isLoading,
    error,
    onRetry,
    onReportsPress,
}: {
    stats: GamificationStats | null;
    isLoading: boolean;
    error: string | null;
    onRetry: () => void;
    onReportsPress: () => void;
}) {
    const { t } = useTranslation();
    const COLORS = useHomeColors();
    return (
        <View
            className="rounded-3xl bg-white dark:bg-[#1A1D24] p-4"
            style={CARD_SHADOW}
        >
            <View className="mb-4 flex-row items-center">
                <View
                    className="mr-3 h-11 w-11 items-center justify-center rounded-full"
                    style={{ backgroundColor: COLORS.surfaceIcon }}
                >
                    <Users size={21} color={COLORS.primary} strokeWidth={2.2} />
                </View>
                <View className="flex-1">
                    <Text
                        className="text-base font-body-bold"
                        style={{ color: COLORS.text }}
                    >
                        {t("home.yourContribution")}
                    </Text>
                    <Text
                        className="font-body mt-0.5 text-xs"
                        style={{ color: COLORS.secondaryText }}
                    >
                        {t("home.yourParticipation")}
                    </Text>
                </View>
                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={t("home.viewMyReports")}
                    onPress={onReportsPress}
                    className="h-9 w-9 items-center justify-center rounded-full"
                    style={{ backgroundColor: COLORS.surfaceIcon  }}
                >
                    <ChevronRight size={19} color={COLORS.primary} />
                </Pressable>
            </View>
            {isLoading ? (
                <ActivityIndicator color={COLORS.primary} />
            ) : error ? (
                <View className="flex-row items-center justify-between">
                    <Text
                        className="font-body mr-3 flex-1 text-sm leading-5"
                        style={{ color: COLORS.secondaryText }}
                    >
                        {error}
                    </Text>
                    <Pressable
                        accessibilityRole="button"
                        onPress={onRetry}
                        className="rounded-xl px-3 py-2"
                        style={{ backgroundColor: COLORS.surfaceIcon }}
                    >
                        <Text
                            className="text-sm font-body-semibold"
                            style={{ color: COLORS.primary }}
                        >
                            {t("home.retryShort")}
                        </Text>
                    </Pressable>
                </View>
            ) : stats ? (
                <View className="flex-row">
                    <View className="flex-1">
                        <Text
                            className="text-2xl font-display"
                            style={{ color: COLORS.text }}
                        >
                            {formatNumber(stats.approved_reports_count)}
                        </Text>
                        <Text
                            className="font-body mt-0.5 text-xs"
                            style={{ color: COLORS.secondaryText }}
                        >
                            {t("home.approvedReports")}
                        </Text>
                    </View>
                    <View className="flex-1">
                        <Text
                            className="text-2xl font-display"
                            style={{ color: COLORS.text }}
                        >
                            {formatNumber(stats.received_trust_votes_count)}
                        </Text>
                        <Text
                            className="font-body mt-0.5 text-xs"
                            style={{ color: COLORS.secondaryText }}
                        >
                            {t("home.trustVotes")}
                        </Text>
                    </View>
                </View>
            ) : null}
            {!error && !isLoading && stats ? (
                <Pressable
                    accessibilityRole="button"
                    onPress={onReportsPress}
                    className="mt-4 flex-row items-center"
                >
                    <Text
                        className="text-sm font-body-semibold ml-2"
                        style={{ color: COLORS.primary }}
                    >
                        {t("home.viewMyReports")}
                    </Text>
                    <ChevronRight size={16} color={COLORS.primary} />
                </Pressable>
            ) : null}
        </View>
    );
}

export default function HomeScreen() {
    const { t } = useTranslation();
    const COLORS = useHomeColors();
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const user = useAuthStore((state) => state.user);
    const requestId = useRef(0);
    const hasLoaded = useRef(false);
    const lastLoadedAt = useRef(0);
    const [overview, setOverview] = useState<AccidentOverview | null>(null);
    const [personalStats, setPersonalStats] =
        useState<GamificationStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [communityError, setCommunityError] = useState<string | null>(null);
    const [personalError, setPersonalError] = useState<string | null>(null);

    const loadDashboard = useCallback(async (showRefreshIndicator = false) => {
        const currentRequestId = ++requestId.current;
        if (showRefreshIndicator) {
            setIsRefreshing(true);
        } else if (!hasLoaded.current) {
            setIsLoading(true);
        }
        setCommunityError(null);
        setPersonalError(null);

        const [overviewResult, personalResult] = await Promise.allSettled([
            getAccidentOverview(),
            getMyGamificationStats(),
        ]);

        if (requestId.current !== currentRequestId) return;

        if (overviewResult.status === "fulfilled") {
            try {
                validateOverview(overviewResult.value);
                setOverview(overviewResult.value);
            } catch (error) {
                if (__DEV__) {
                    console.warn("Estatísticas de acidentes inválidas", error);
                }
                setCommunityError(
                    t("home.invalidStats"),
                );
            }
        } else {
            if (__DEV__) {
                console.warn(
                    "Falha ao carregar o panorama de acidentes",
                    overviewResult.reason,
                );
            }
            setCommunityError(
                t("home.connectionError"),
            );
        }

        if (personalResult.status === "fulfilled") {
            try {
                validatePersonalStats(personalResult.value);
                setPersonalStats(personalResult.value);
            } catch (error) {
                if (__DEV__) {
                    console.warn("Estatísticas pessoais inválidas", error);
                }
                setPersonalError(
                    t("home.invalidPersonalStats"),
                );
            }
        } else {
            if (__DEV__) {
                console.warn(
                    "Falha ao carregar as estatísticas pessoais",
                    personalResult.reason,
                );
            }
            setPersonalError(
                t("home.personalConnectionError"),
            );
        }

        hasLoaded.current = true;
        lastLoadedAt.current = Date.now();
        setIsLoading(false);
        setIsRefreshing(false);
    }, [t]);

    useFocusEffect(
        useCallback(() => {
            // Evita refazer as requisições (e re-renderizar a tela inteira
            // durante a transição de aba) quando os dados acabaram de chegar.
            if (
                !hasLoaded.current ||
                Date.now() - lastLoadedAt.current > FOCUS_REFRESH_INTERVAL_MS
            ) {
                void loadDashboard();
            }
            const subscription =
                Notifications.addNotificationReceivedListener(
                    (notification) => {
                        const { type, accidentId } =
                            notification.request.content.data;
                        if (
                            type === ACCIDENT_APPROVED_EVENT &&
                            typeof accidentId === "string"
                        ) {
                            void loadDashboard();
                        }
                    },
                );

            return () => {
                requestId.current += 1;
                subscription.remove();
            };
        }, [loadDashboard]),
    );

    const firstName = user?.name.trim().split(/\s+/)[0] || t("home.greetingFallback");
    const openAccident = (accidentId: string) => {
        router.push({
            pathname: "/map/[accidentId]",
            params: { accidentId },
        });
    };

    return (
        <View
            className="flex-1"
            style={{ backgroundColor: COLORS.background }}
        >
            <ScrollView
                className="flex-1"
                contentContainerStyle={{
                    paddingTop: insets.top + 16,
                    paddingBottom: insets.bottom + 100,
                    paddingHorizontal: 16,
                }}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefreshing}
                        onRefresh={() => void loadDashboard(true)}
                        tintColor={COLORS.primary}
                        colors={[COLORS.primary]}
                    />
                }
            >
                <View className="mb-5">
                    {/* Badge de Verificação de E-mail */}
                    {!user?.is_email_verified && (
                        <Pressable
                            accessibilityRole="button"
                            accessibilityLabel={t("home.verifyEmailLabel")}
                            onPress={() => router.push(verifyEmailFromAppRoute)}
                            className="mb-3 flex-row items-center gap-2 rounded-xl bg-amber-100 dark:bg-[#2B2313] px-3 py-2"
                        >
                            <Mail size={16} color="#F59E0B" strokeWidth={2} />
                            <Text className="flex-1 text-xs font-body-medium text-amber-700 dark:text-[#F5D58A]">
                                {t("home.verifyEmailBanner")}
                            </Text>
                            <Text className="text-xs font-body-bold text-amber-800 dark:text-[#F5D58A]">
                                {t("home.verify")}
                            </Text>
                        </Pressable>
                    )}
                    <View className="mb-5 flex-row items-center">
                        <Image
                            source={require("../../../assets/images/farol-logo.png")}
                            accessibilityIgnoresInvertColors
                            resizeMode="contain"
                            className="mr-2"
                            style={{ width: 30, height: 36 }}
                        />
                        <Text
                            className="text-xl font-display-extrabold"
                            style={{ color: COLORS.text }}
                        >
                            Farol
                        </Text>
                    </View>
                    <Text
                        className="text-[25px] font-display leading-8"
                        style={{ color: COLORS.text }}
                    >
                        {t("home.greeting", { name: firstName })}
                    </Text>
                    <Text
                        className="font-body mt-1 text-sm leading-5"
                        style={{ color: COLORS.secondaryText }}
                    >
                        {t("home.tagline")}
                    </Text>
                    <View className="mt-3 flex-row items-center self-start rounded-full bg-white dark:bg-[#1A1D24] px-3 py-1.5">
                        <MapPin size={13} color={COLORS.primary} />
                        <Text
                            className="ml-1.5 text-xs font-body-semibold"
                            style={{ color: COLORS.primary }}
                        >
                            Imperatriz, MA
                        </Text>
                    </View>
                </View>

                <View className="mb-5 flex-row items-center">
                    <Car size={20} color={COLORS.primary} strokeWidth={2.2} />
                    <Text
                        className="ml-2 text-lg font-body-bold"
                        style={{ color: COLORS.text }}
                    >
                        {t("home.communityOverview")}
                    </Text>
                </View>

                {isLoading && !overview ? (
                    <View
                        className="mb-4 items-center rounded-3xl bg-white dark:bg-[#1A1D24] py-10"
                        style={CARD_SHADOW}
                    >
                        <ActivityIndicator size="large" color={COLORS.primary} />
                        <Text
                            className="font-body mt-3 text-sm"
                            style={{ color: COLORS.secondaryText }}
                        >
                            {t("home.loadingStats")}
                        </Text>
                    </View>
                ) : communityError && !overview ? (
                    <View className="mb-4">
                        <CommunityError
                            message={communityError}
                            onRetry={() => void loadDashboard()}
                        />
                    </View>
                ) : overview ? (
                    <>
                        {communityError ? (
                            <Pressable
                                accessibilityRole="button"
                                onPress={() => void loadDashboard(true)}
                                className="mb-3 flex-row items-center rounded-2xl bg-white dark:bg-[#1A1D24] px-4 py-3"
                                style={CARD_SHADOW}
                            >
                                <RefreshCw
                                    size={16}
                                    color={COLORS.primary}
                                />
                                <Text
                                    className="font-body ml-2 flex-1 text-xs"
                                    style={{ color: COLORS.secondaryText }}
                                >
                                    {t("home.refreshError")}
                                </Text>
                            </Pressable>
                        ) : null}
                        <View className="mb-3 flex-row gap-3">
                            <MetricCard
                                icon={Car}
                                label={t("home.accidentsOccurred")}
                                value={overview.approved_accidents_count}
                                detail={t("home.availableRecords")}
                            />
                            <MetricCard
                                icon={Users}
                                label={t("home.withVictims")}
                                value={overview.accidents_with_victims_count}
                                detail={t("home.classifiedAtOccurrence")}
                            />
                        </View>
                        <View className="mb-4 flex-row gap-3">
                            <MetricCard
                                icon={ShieldAlert}
                                label={t("home.highSeverity")}
                                value={overview.high_severity_accidents_count}
                                detail={t("home.highOrCritical")}
                            />
                            
                        </View>
                        
                        <View className="mb-4">
                            <TimeOfDayCard periods={overview.time_of_day} />
                        </View>
                        <View className="mb-4">
                            <SeverityCard overview={overview} />
                        </View>
                        <View className="mb-5">
                            <RecentAccidentsCard
                                overview={overview}
                                onAccidentPress={openAccident}
                                onOpenMap={() => router.push("/map")}
                            />
                        </View>
                    </>
                ) : null}

                <View className="mb-5 flex-row items-center">
                    <Users size={20} color={COLORS.primary} strokeWidth={2.2} />
                    <Text
                        className="ml-2 text-lg font-body-bold"
                        style={{ color: COLORS.text }}
                    >
                        {t("home.partOfChange")}
                    </Text>
                </View>
                <View className="mb-5">
                    <PersonalContribution
                        stats={personalStats}
                        isLoading={isLoading && !hasLoaded.current}
                        error={personalError}
                        onRetry={() => void loadDashboard()}
                        onReportsPress={() => router.push("/profile/reports")}
                    />
                </View>

                <View
                    className="rounded-3xl p-5"
                    style={{ backgroundColor: COLORS.primary }}
                >
                    <Text className="text-lg font-body-bold text-white">
                        {t("home.helpTitle")}
                    </Text>
                    <Text className="font-body mt-1 text-sm leading-5 text-white/85">
                        {t("home.helpBody")}
                    </Text>
                    <Pressable
                        accessibilityRole="button"
                        onPress={() => router.push("/report")}
                        className="mt-4 flex-row items-center self-start rounded-xl bg-white dark:bg-[#1A1D24] px-4 py-2.5"
                    >
                        <Text
                            className="text-sm font-body-bold"
                            style={{ color: COLORS.primary }}
                        >
                            {t("home.reportAccident")}
                        </Text>
                        <ChevronRight
                            size={17}
                            color={COLORS.primary}
                            style={{ marginLeft: 4 }}
                        />
                    </Pressable>
                </View>
            </ScrollView>
        </View>
    );
}
