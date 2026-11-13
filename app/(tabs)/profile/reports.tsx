import { useCallback, useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Image,
    Pressable,
    ScrollView,
    View,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import {
    ArrowLeft,
    Check,
    Clock3,
    MapPin,
    X,
    type LucideIcon,
} from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Text } from "@/components/ui/text";
import { getMyReports, type MyReport, type ReportStatus } from "@/src/api/reports";
import { reverseGeocode } from "@/src/features/map/services/reverseGeocode";

import { useAppTheme } from "@/src/theme/useAppTheme";
import { useTranslation, type Language, type TranslationKey } from "@/src/i18n";
import { type AppColors } from "@/src/theme/colors";

type StatusFilter = {
    status: ReportStatus;
    label: string;
    icon: LucideIcon;
    color: string;
    background: string;
};

const getStatusFilters = (
    colors: AppColors,
    t: (key: TranslationKey) => string,
): StatusFilter[] => [
    {
        status: "APPROVED",
        label: t("reports.approved"),
        icon: Check,
        color: colors.success,
        background: colors.successContainer,
    },
    {
        status: "PENDING",
        label: t("reports.pending"),
        icon: Clock3,
        color: colors.warning,
        background: colors.warningContainer,
    },
    {
        status: "REJECTED",
        label: t("reports.rejected"),
        icon: X,
        color: colors.error,
        background: colors.errorContainer,
    },
];

const PAGE_SIZE = 20;

export default function MyReportsScreen() {
    const { t } = useTranslation();
    const STATUS_FILTERS = getStatusFilters(useAppTheme().colors, t);
    const { colors } = useAppTheme();
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const requestId = useRef(0);
    const [status, setStatus] = useState<ReportStatus>("APPROVED");
    const [reports, setReports] = useState<MyReport[]>([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loadMoreError, setLoadMoreError] = useState(false);

    const loadReports = useCallback(async () => {
        const currentRequestId = ++requestId.current;
        setIsLoading(true);
        setIsLoadingMore(false);
        setError(null);
        setReports([]);
        setPage(1);
        setTotalPages(1);
        setLoadMoreError(false);

        try {
            const response = await getMyReports({
                status,
                page: 1,
                limit: PAGE_SIZE,
            });
            if (requestId.current !== currentRequestId) return;
            setReports(response.data);
            setPage(response.pagination.page);
            setTotalPages(response.pagination.totalPages);
        } catch (cause) {
            if (__DEV__) {
                console.warn("Falha ao carregar meus relatos", cause);
            }
            if (requestId.current === currentRequestId) {
                setError(t("reports.loadError"));
            }
        } finally {
            if (requestId.current === currentRequestId) {
                setIsLoading(false);
            }
        }
    }, [status, t]);

    useFocusEffect(
        useCallback(() => {
            void loadReports();
            return () => {
                requestId.current += 1;
            };
        }, [loadReports]),
    );

    const loadMore = async () => {
        if (isLoadingMore || page >= totalPages) return;

        const currentRequestId = requestId.current;
        const nextPage = page + 1;
        setIsLoadingMore(true);
        setLoadMoreError(false);

        try {
            const response = await getMyReports({
                status,
                page: nextPage,
                limit: PAGE_SIZE,
            });
            if (requestId.current !== currentRequestId) return;
            setReports((current) => [...current, ...response.data]);
            setPage(response.pagination.page);
            setTotalPages(response.pagination.totalPages);
        } catch (cause) {
            if (__DEV__) {
                console.warn("Falha ao carregar mais relatos", cause);
            }
            if (requestId.current === currentRequestId) {
                setLoadMoreError(true);
            }
        } finally {
            if (requestId.current === currentRequestId) {
                setIsLoadingMore(false);
            }
        }
    };

    return (
        <View className="flex-1" style={{ backgroundColor: colors.background }}>
            <View
                className="flex-row items-center justify-between bg-white dark:bg-[#1A1D24] px-4"
                style={{
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
                <Text className="text-lg font-body-semibold text-[#181C23] dark:text-[#ECEEF4]">
                    {t("reports.title")}
                </Text>
                <View className="h-11 w-11" />
            </View>

            <ScrollView
                contentContainerStyle={{
                    paddingHorizontal: 16,
                    paddingTop: 16,
                    paddingBottom: insets.bottom + 24,
                }}
                showsVerticalScrollIndicator={false}
            >
                <View className="mb-5 flex-row rounded-2xl bg-[#E3E5EF] dark:bg-[#242833] p-1">
                    {STATUS_FILTERS.map((filter) => {
                        const Icon = filter.icon;
                        const isSelected = status === filter.status;

                        return (
                            <Pressable
                                key={filter.status}
                                accessibilityRole="tab"
                                accessibilityLabel={filter.label}
                                accessibilityState={{ selected: isSelected }}
                                onPress={() => setStatus(filter.status)}
                                className="h-11 flex-1 items-center justify-center rounded-xl"
                                style={{
                                    backgroundColor: isSelected
                                        ? colors.surface
                                        : "transparent",
                                }}
                            >
                                <Icon
                                    size={21}
                                    color={isSelected ? filter.color : colors.onSurfaceVariant}
                                    strokeWidth={2.5}
                                />
                            </Pressable>
                        );
                    })}
                </View>

                {isLoading ? (
                    <View className="items-center py-16">
                        <ActivityIndicator size="large" color={colors.primary} />
                        <Text className="font-body mt-3 text-sm text-[#626B7A] dark:text-[#AAB0BD]">
                            {t("reports.loading")}
                        </Text>
                    </View>
                ) : error ? (
                    <View className="items-center rounded-2xl bg-white dark:bg-[#1A1D24] px-5 py-8">
                        <Text className="font-body text-center text-[15px] leading-6 text-[#414755] dark:text-[#AAB0BD]">
                            {error}
                        </Text>
                        <Pressable
                            accessibilityRole="button"
                            onPress={() => void loadReports()}
                            className="mt-4 rounded-xl bg-[#0058BC] px-5 py-3"
                        >
                            <Text className="font-body-semibold text-white">
                                {t("common.retry")}
                            </Text>
                        </Pressable>
                    </View>
                ) : reports.length === 0 ? (
                    <EmptyReports status={status} />
                ) : (
                    <View className="gap-4">
                        {reports.map((report) => (
                            <ReportCard key={report.id} report={report} />
                        ))}

                        {page < totalPages && (
                            <Pressable
                                accessibilityRole="button"
                                onPress={() => void loadMore()}
                                disabled={isLoadingMore}
                                className="h-12 items-center justify-center rounded-xl bg-white dark:bg-[#1A1D24]"
                            >
                                {isLoadingMore ? (
                                    <ActivityIndicator
                                        size="small"
                                        color={colors.primary}
                                    />
                                ) : (
                                    <Text className="font-body-semibold text-[#0058BC] dark:text-[#3B87F5]">
                                        {loadMoreError
                                            ? t("reports.loadMoreRetry")
                                            : t("reports.loadMore")}
                                    </Text>
                                )}
                            </Pressable>
                        )}
                    </View>
                )}
            </ScrollView>
        </View>
    );
}

function EmptyReports({ status }: { status: ReportStatus }) {
    const { t } = useTranslation();
    const STATUS_FILTERS = getStatusFilters(useAppTheme().colors, t);
    const selectedFilter = STATUS_FILTERS.find(
        (filter) => filter.status === status,
    )!;
    const Icon = selectedFilter.icon;

    return (
        <View className="items-center rounded-2xl bg-white dark:bg-[#1A1D24] px-6 py-10">
            <View
                className="mb-4 h-14 w-14 items-center justify-center rounded-full"
                style={{ backgroundColor: selectedFilter.background }}
            >
                <Icon size={26} color={selectedFilter.color} />
            </View>
            <Text className="text-center text-base font-body-semibold text-[#181C23] dark:text-[#ECEEF4]">
                {t("reports.emptyTitle", {
                    status: selectedFilter.label.toLowerCase(),
                })}
            </Text>
            <Text className="font-body mt-2 text-center text-sm leading-5 text-[#626B7A] dark:text-[#AAB0BD]">
                {t("reports.emptyMessage")}
            </Text>
        </View>
    );
}

function ReportCard({ report }: { report: MyReport }) {
    const { t, language } = useTranslation();
    const STATUS_FILTERS = getStatusFilters(useAppTheme().colors, t);
    const { colors } = useAppTheme();
    const filter = STATUS_FILTERS.find(
        (item) => item.status === report.moderation_status,
    )!;
    const StatusIcon = filter.icon;
    const image = report.images[0];
    const [address, setAddress] = useState(() => t("reports.searchingAddress"));

    useEffect(() => {
        let isMounted = true;

        reverseGeocode(report.longitude, report.latitude)
            .then((resolvedAddress) => {
                if (isMounted) setAddress(resolvedAddress);
            })
            .catch((cause: unknown) => {
                if (__DEV__) {
                    console.warn(
                        `Falha ao buscar endereço do relato ${report.id}`,
                        cause,
                    );
                }
                if (isMounted) setAddress(t("reports.addressUnavailable"));
            });

        return () => {
            isMounted = false;
        };
    }, [report.id, report.latitude, report.longitude, t]);

    return (
        <View className="overflow-hidden rounded-2xl bg-white dark:bg-[#1A1D24] p-4">
            <View className="mb-3 flex-row items-start justify-between gap-3">
                <Text
                    className="flex-1 text-[18px] font-display-semibold leading-6 text-[#181C23] dark:text-[#ECEEF4]"
                    numberOfLines={2}
                >
                    {report.tipo_acidente}
                </Text>
                <View
                    accessibilityLabel={filter.label}
                    className="h-8 w-8 items-center justify-center rounded-full"
                    style={{ backgroundColor: filter.background }}
                >
                    <StatusIcon
                        size={17}
                        color={filter.color}
                        strokeWidth={2.6}
                    />
                </View>
            </View>

            <Text className="font-body mb-3 text-[13px] text-[#414755] dark:text-[#AAB0BD]">
                {formatOccurrenceDate(report.occurred_at, language) ??
                    t("reports.dateUnavailable")}{" "}
                <Text className="text-[#7B8290] dark:text-[#8B92A1]">•</Text>{" "}
                {report.latitude.toFixed(4)}, {report.longitude.toFixed(4)}
            </Text>

            <View className="mb-3 flex-row items-start gap-2">
                <MapPin size={17} color={colors.primary} />
                <Text
                    className="font-body flex-1 text-[13px] leading-5 text-[#414755] dark:text-[#AAB0BD]"
                    accessibilityLabel={t("reports.addressLabel", { address })}
                >
                    {address}
                </Text>
            </View>

            {image ? (
                <Image
                    accessibilityLabel={image.caption ?? t("reports.imageFallback")}
                    source={{ uri: image.image_url }}
                    resizeMode="cover"
                    className="h-40 w-full rounded-xl bg-[#E8ECF2] dark:bg-[#242833]"
                />
            ) : null}

            {report.moderation_status === "REJECTED" && (
                <View className="mt-3 rounded-xl bg-[#FFF2F0] dark:bg-[#2C1715] p-3">
                    <Text className="mb-1 text-[13px] font-body-semibold text-[#9F2018] dark:text-[#FF7B70]">
                        {t("reports.rejectionReason")}
                    </Text>
                    <Text className="font-body text-[13px] leading-5 text-[#6F2924] dark:text-[#F2B8B5]">
                        {report.moderation_message?.trim() ||
                            t("reports.noRejectionReason")}
                    </Text>
                </View>
            )}
        </View>
    );
}

function formatOccurrenceDate(value: string, language: Language) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;

    return new Intl.DateTimeFormat(language, {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
    }).format(date);
}
