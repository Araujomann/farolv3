import { Car, RefreshCw, ShieldAlert, Users } from "lucide-react-native";
import { ActivityIndicator, Pressable, View } from "react-native";

import { Text } from "@/components/ui/text";
import type { AccidentOverview } from "@/src/api/accidents";
import { CommunityError } from "@/src/features/home/components/CommunityError";
import { MetricCard } from "@/src/features/home/components/MetricCard";
import { RecentAccidentsCard } from "@/src/features/home/components/RecentAccidentsCard";
import { SeverityCard } from "@/src/features/home/components/SeverityCard";
import { TimeOfDayCard } from "@/src/features/home/components/TimeOfDayCard";
import { CARD_SHADOW } from "@/src/features/home/constants";
import { useHomeColors } from "@/src/features/home/hooks/useHomeColors";
import { useTranslation } from "@/src/i18n";

type CommunityOverviewProps = {
    overview: AccidentOverview | null;
    isLoading: boolean;
    error: string | null;
    /** Nova tentativa após falha sem dados (sem indicador de refresh). */
    onRetry: () => void;
    /** Recarrega mantendo os dados atuais (com indicador de refresh). */
    onRefresh: () => void;
    onAccidentPress: (accidentId: string) => void;
    onOpenMap: () => void;
};

/**
 * Panorama da comunidade: carregamento, erro sem dados ou as métricas,
 * com um aviso de falha na atualização quando já há dados exibidos.
 */
export function CommunityOverview({
    overview,
    isLoading,
    error,
    onRetry,
    onRefresh,
    onAccidentPress,
    onOpenMap,
}: CommunityOverviewProps) {
    const { t } = useTranslation();
    const COLORS = useHomeColors();

    return isLoading && !overview ? (
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
    ) : error && !overview ? (
        <View className="mb-4">
            <CommunityError
                message={error}
                onRetry={onRetry}
            />
        </View>
    ) : overview ? (
        <>
            {error ? (
                <Pressable
                    accessibilityRole="button"
                    onPress={onRefresh}
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
                    onAccidentPress={onAccidentPress}
                    onOpenMap={onOpenMap}
                />
            </View>
        </>
    ) : null;
}
