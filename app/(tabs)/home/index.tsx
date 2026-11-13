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
    Pressable,
    RefreshControl,
    ScrollView,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const COLORS = {
    primary: "#0058BC",
    background: "#F2F2F7",
    surface: "#FFFFFF",
    surfaceIcon: "#ECECF8",
    text: "#181C23",
    secondaryText: "#626A78",
    border: "#E5E7EF",
    positive: "#238636",
    positiveBackground: "#EAF6EC",
    negative: "#B42318",
    negativeBackground: "#FCEDEA",
    severity: {
        low: "#0969D7",
        medium: "#D99A24",
        high: "#D9534F",
        critical: "#B42318",
    },
} as const;

const SEVERITY_LABELS: Record<AccidentSeverity, string> = {
    low: "Baixa",
    medium: "Média",
    high: "Alta",
    critical: "Crítica",
};

const CARD_SHADOW = {
    elevation: 2,
    shadowColor: "#202A44",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
};

function formatNumber(value: number) {
    return new Intl.NumberFormat("pt-BR").format(value);
}

function formatRelativeTime(value: string) {
    const timestamp = new Date(value).getTime();
    if (!Number.isFinite(timestamp)) return "Data indisponível";

    const elapsedMinutes = Math.max(
        0,
        Math.floor((Date.now() - timestamp) / 60_000),
    );

    if (elapsedMinutes < 60) {
        return elapsedMinutes <= 1 ? "Agora" : `Há ${elapsedMinutes} min`;
    }

    const elapsedHours = Math.floor(elapsedMinutes / 60);
    if (elapsedHours < 24) {
        return `Há ${elapsedHours} h`;
    }

    const elapsedDays = Math.floor(elapsedHours / 24);
    return `Há ${elapsedDays} ${elapsedDays === 1 ? "dia" : "dias"}`;
}

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
    return (
        <View
            className="min-h-[150px] flex-1 rounded-3xl bg-white p-4"
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
                ? "Novos registros"
                : "Sem registros"
            : `${change > 0 ? "+" : ""}${change}%`;

}

function TimeOfDayCard({
    periods,
}: {
    periods: AccidentOverview["time_of_day"];
}) {
    const maxCount = Math.max(1, ...periods.map((period) => period.count));

    return (
        <View
            className="rounded-3xl bg-white p-4"
            style={CARD_SHADOW}
        >
            <View className="flex-row items-center">
                <Clock3 size={21} color={COLORS.primary} strokeWidth={2.2} />
                <Text
                    className="ml-2 flex-1 text-base font-body-bold"
                    style={{ color: COLORS.text }}
                >
                    Acidentes por horário
                </Text>
                <Text
                    className="font-body text-xs"
                    style={{ color: COLORS.secondaryText }}
                >
                    Últimos 30 dias
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
    const total = overview.approved_accidents_count;
    const severities: AccidentSeverity[] = [
        "low",
        "medium",
        "high",
        "critical",
    ];

    return (
        <View
            className="rounded-3xl bg-white p-4"
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
                        Gravidade dos acidentes
                    </Text>
                    <Text
                        className="font-body mt-0.5 text-xs"
                        style={{ color: COLORS.secondaryText }}
                    >
                        Entre os registros aprovados
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
                                    {SEVERITY_LABELS[severity]}
                                </Text>
                                <Text
                                    className="text-xs font-body-semibold"
                                    style={{ color: COLORS.secondaryText }}
                                >
                                    {formatNumber(count)} · {percentage}%
                                </Text>
                            </View>
                            <View className="h-2 overflow-hidden rounded-full bg-[#EEF0F5]">
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
    return (
        <View
            className="items-center rounded-3xl bg-white px-5 py-7"
            style={CARD_SHADOW}
        >
            <Activity size={25} color={COLORS.primary} />
            <Text
                className="mt-3 text-center text-base font-body-semibold"
                style={{ color: COLORS.text }}
            >
                Não foi possível carregar o panorama
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
                    Tentar novamente
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
    return (
        <View
            className="rounded-3xl bg-white p-4"
            style={CARD_SHADOW}
        >
            <View className="mb-2 flex-row items-center">
                <Text
                    className="flex-1 text-base font-body-bold"
                    style={{ color: COLORS.text }}
                >
                    Acidentes recentes
                </Text>
                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Abrir mapa de acidentes"
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
                    Ainda não há acidentes aprovados para exibir.
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
                                {accident.tipo_acidente}
                            </Text>
                            <Text
                                numberOfLines={1}
                                className="font-body mt-0.5 text-xs"
                                style={{ color: COLORS.secondaryText }}
                            >
                                {accident.classificacao_acidente === "com_vitima"
                                    ? "Com vítima"
                                    : "Sem vítima"}
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
    return (
        <View
            className="rounded-3xl bg-white p-4"
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
                        Sua contribuição
                    </Text>
                    <Text
                        className="font-body mt-0.5 text-xs"
                        style={{ color: COLORS.secondaryText }}
                    >
                        Sua participação na comunidade
                    </Text>
                </View>
                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Ver meus relatos"
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
                            Tentar
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
                            Relatos aprovados
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
                            Votos de confiança
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
                        Ver meus relatos
                    </Text>
                    <ChevronRight size={16} color={COLORS.primary} />
                </Pressable>
            ) : null}
        </View>
    );
}

export default function HomeScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const user = useAuthStore((state) => state.user);
    const requestId = useRef(0);
    const hasLoaded = useRef(false);
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
                    "A resposta recebida não contém estatísticas válidas. Tente novamente.",
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
                "Verifique sua conexão e tente carregar os dados novamente.",
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
                    "Não foi possível validar suas estatísticas. Tente novamente.",
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
                "Verifique sua conexão e tente carregar novamente.",
            );
        }

        hasLoaded.current = true;
        setIsLoading(false);
        setIsRefreshing(false);
    }, []);

    useFocusEffect(
        useCallback(() => {
            void loadDashboard();
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

    const firstName = user?.name.trim().split(/\s+/)[0] || "por aqui";
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
                            accessibilityLabel="Verificar e-mail"
                            onPress={() => router.push(verifyEmailFromAppRoute)}
                            className="mb-3 flex-row items-center gap-2 rounded-xl bg-amber-100 px-3 py-2"
                        >
                            <Mail size={16} color="#F59E0B" strokeWidth={2} />
                            <Text className="flex-1 text-xs font-body-medium text-amber-700">
                                Verifique seu e-mail para relatar acidentes e comentar
                            </Text>
                            <Text className="text-xs font-body-bold text-amber-800">
                                Verificar
                            </Text>
                        </Pressable>
                    )}
                    <View className="mb-5 flex-row items-center">
                        <View
                            className="mr-2 h-9 w-9 items-center justify-center rounded-xl"
                            style={{ backgroundColor: COLORS.primary }}
                        >
                            <MapPin size={20} color="#FFFFFF" strokeWidth={2.4} />
                        </View>
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
                        Olá, {firstName}! 👋
                    </Text>
                    <Text
                        className="font-body mt-1 text-sm leading-5"
                        style={{ color: COLORS.secondaryText }}
                    >
                        Acompanhe a segurança viária em Imperatriz.
                    </Text>
                    <View className="mt-3 flex-row items-center self-start rounded-full bg-white px-3 py-1.5">
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
                        Panorama da comunidade
                    </Text>
                </View>

                {isLoading && !overview ? (
                    <View
                        className="mb-4 items-center rounded-3xl bg-white py-10"
                        style={CARD_SHADOW}
                    >
                        <ActivityIndicator size="large" color={COLORS.primary} />
                        <Text
                            className="font-body mt-3 text-sm"
                            style={{ color: COLORS.secondaryText }}
                        >
                            Carregando estatísticas...
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
                                className="mb-3 flex-row items-center rounded-2xl bg-white px-4 py-3"
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
                                    Não foi possível atualizar os dados. Toque para tentar novamente.
                                </Text>
                            </Pressable>
                        ) : null}
                        <View className="mb-3 flex-row gap-3">
                            <MetricCard
                                icon={Car}
                                label="Acidentes ocorridos"
                                value={overview.approved_accidents_count}
                                detail="Registros disponíveis"
                            />
                            <MetricCard
                                icon={Users}
                                label="Com vítima"
                                value={overview.accidents_with_victims_count}
                                detail="Classificados na ocorrência"
                            />
                        </View>
                        <View className="mb-4 flex-row gap-3">
                            <MetricCard
                                icon={ShieldAlert}
                                label="Alta gravidade"
                                value={overview.high_severity_accidents_count}
                                detail="Alta ou crítica"
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
                        Você faz parte dessa mudança
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
                        Ajude a cuidar do caminho
                    </Text>
                    <Text className="font-body mt-1 text-sm leading-5 text-white/85">
                        Um relato pode ajudar outras pessoas a dirigir com mais atenção.
                    </Text>
                    <Pressable
                        accessibilityRole="button"
                        onPress={() => router.push("/report")}
                        className="mt-4 flex-row items-center self-start rounded-xl bg-white px-4 py-2.5"
                    >
                        <Text
                            className="text-sm font-body-bold"
                            style={{ color: COLORS.primary }}
                        >
                            Relatar acidente
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
