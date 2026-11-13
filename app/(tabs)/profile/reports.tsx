import { useCallback, useMemo, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Pressable,
    View,
    type ListRenderItem,
} from "react-native";
import { useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Text } from "@/components/ui/text";
import type { MyReport, ReportStatus } from "@/src/api/reports";
import { EmptyReports } from "@/src/features/profile/components/reports/EmptyReports";
import { ReportCard } from "@/src/features/profile/components/reports/ReportCard";
import { ReportStatusTabs } from "@/src/features/profile/components/reports/ReportStatusTabs";
import { getStatusFilters } from "@/src/features/profile/constants/reportStatusFilters";
import { useMyReports } from "@/src/features/profile/hooks/useMyReports";

import { useAppTheme } from "@/src/theme/useAppTheme";
import { useTranslation } from "@/src/i18n";

const keyExtractor = (report: MyReport) => report.id;
const ReportSeparator = () => <View className="h-4" />;

export default function MyReportsScreen() {
    const { t } = useTranslation();
    const { colors } = useAppTheme();
    const statusFilters = useMemo(
        () => getStatusFilters(colors, t),
        [colors, t],
    );
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const [status, setStatus] = useState<ReportStatus>("APPROVED");
    const {
        reports,
        page,
        totalPages,
        isLoading,
        isLoadingMore,
        error,
        loadMoreError,
        loadReports,
        loadMore,
    } = useMyReports(status);

    const findFilter = useCallback(
        (value: ReportStatus) =>
            statusFilters.find((filter) => filter.status === value) ??
            statusFilters[0],
        [statusFilters],
    );

    const renderReport = useCallback<ListRenderItem<MyReport>>(
        ({ item }) => (
            <ReportCard
                report={item}
                filter={findFilter(item.moderation_status)}
            />
        ),
        [findFilter],
    );

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
                    onPress={() => router.dismissTo("/profile")}
                    className="h-11 w-11 items-center justify-center"
                >
                    <ArrowLeft size={24} color={colors.primary} />
                </Pressable>
                <Text className="text-lg font-body-semibold text-[#181C23] dark:text-[#ECEEF4]">
                    {t("reports.title")}
                </Text>
                <View className="h-11 w-11" />
            </View>

            {/* Lista virtualizada: só os cards próximos da tela ficam montados. */}
            <FlatList
                data={isLoading || error ? [] : reports}
                keyExtractor={keyExtractor}
                renderItem={renderReport}
                ItemSeparatorComponent={ReportSeparator}
                contentContainerStyle={{
                    paddingHorizontal: 16,
                    paddingTop: 16,
                    paddingBottom: insets.bottom + 24,
                }}
                showsVerticalScrollIndicator={false}
                initialNumToRender={4}
                maxToRenderPerBatch={4}
                windowSize={7}
                removeClippedSubviews
                ListHeaderComponent={
                    <ReportStatusTabs
                        filters={statusFilters}
                        selectedStatus={status}
                        onSelect={setStatus}
                    />
                }
                ListEmptyComponent={
                    isLoading ? (
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
                    ) : (
                        <EmptyReports filter={findFilter(status)} />
                    )
                }
                ListFooterComponent={
                    !isLoading && !error && page < totalPages ? (
                        <Pressable
                            accessibilityRole="button"
                            onPress={() => void loadMore()}
                            disabled={isLoadingMore}
                            className="mt-4 h-12 items-center justify-center rounded-xl bg-white dark:bg-[#1A1D24]"
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
                    ) : null
                }
            />
        </View>
    );
}
