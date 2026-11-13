import { CommunityOverview } from "@/src/features/home/components/CommunityOverview";
import { HelpCallout } from "@/src/features/home/components/HelpCallout";
import { HomeHeader } from "@/src/features/home/components/HomeHeader";
import { PersonalContribution } from "@/src/features/home/components/PersonalContribution";
import { SectionHeading } from "@/src/features/home/components/SectionHeading";
import { useHomeColors } from "@/src/features/home/hooks/useHomeColors";
import { useHomeDashboard } from "@/src/features/home/hooks/useHomeDashboard";
import { useAuthStore } from "@/src/store/authStore";
import { verifyEmailFromAppRoute } from "@/src/features/auth/verifyEmailRoute";
import { useRouter } from "expo-router";
import { Car, Users } from "lucide-react-native";
import { RefreshControl, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTranslation } from "@/src/i18n";

export default function HomeScreen() {
    const { t } = useTranslation();
    const COLORS = useHomeColors();
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const user = useAuthStore((state) => state.user);
    const {
        overview,
        personalStats,
        isLoading,
        isRefreshing,
        communityError,
        personalError,
        hasLoaded,
        loadDashboard,
    } = useHomeDashboard();

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
                <HomeHeader
                    isEmailVerified={user?.is_email_verified}
                    firstName={firstName}
                    onVerifyEmail={() => router.push(verifyEmailFromAppRoute)}
                />

                <SectionHeading icon={Car} title={t("home.communityOverview")} />

                <CommunityOverview
                    overview={overview}
                    isLoading={isLoading}
                    error={communityError}
                    onRetry={() => void loadDashboard()}
                    onRefresh={() => void loadDashboard(true)}
                    onAccidentPress={openAccident}
                    onOpenMap={() => router.push("/map")}
                />

                <SectionHeading icon={Users} title={t("home.partOfChange")} />
                <View className="mb-5">
                    <PersonalContribution
                        stats={personalStats}
                        isLoading={isLoading && !hasLoaded}
                        error={personalError}
                        onRetry={() => void loadDashboard()}
                        onReportsPress={() => router.push("/profile/reports")}
                    />
                </View>

                <HelpCallout onReportPress={() => router.push("/report")} />
            </ScrollView>
        </View>
    );
}
