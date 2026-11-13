import { useEffect, useState } from "react";
import { Alert, Modal, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import AboutScreen from "@/src/features/profile/components/AboutScreen";
import { AvatarSection } from "@/src/features/profile/components/AvatarSection";
import {
    GamificationError,
    GamificationLoading,
} from "@/src/features/profile/components/GamificationStatus";
import { LevelCard } from "@/src/features/profile/components/LevelCard";
import { LogoutDialog } from "@/src/features/profile/components/LogoutDialog";
import { LogoutSection } from "@/src/features/profile/components/LogoutSection";
import { ProfileMenu } from "@/src/features/profile/components/ProfileMenu";
import { ProfileTopAppBar } from "@/src/features/profile/components/ProfileTopAppBar";
import { ProgressCard } from "@/src/features/profile/components/ProgressCard";
import { TrustVotesCard } from "@/src/features/profile/components/TrustVotesCard";
import {
    getLevelProgress,
    POINTS_PER_APPROVED_REPORT,
} from "@/src/features/profile/constants/levels";
import { useGamificationStats } from "@/src/features/profile/hooks/useGamificationStats";
import { useProfileTitleColorStore } from "@/src/features/profile/titleColorStore";
import { useAuthStore } from "@/src/store/authStore";
import { verifyEmailFromAppRoute } from "@/src/features/auth/verifyEmailRoute";
import { AdministrativeNoticesPanel } from "@/src/features/notifications/components/AdministrativeNoticesPanel";

import { useAppTheme } from "@/src/theme/useAppTheme";
import { useTranslation } from "@/src/i18n";

export default function ProfileScreen() {
    const { t } = useTranslation();
    const { colors } = useAppTheme();
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
    const {
        approvedReportsCount,
        receivedTrustVotesCount,
        isLoadingGamification,
        gamificationError,
        loadGamification,
    } = useGamificationStats();

    const handleLogout = async () => {
        setIsLoggingOut(true);
        try {
            await signOut();
            setIsLogoutDialogVisible(false);
            router.replace("/(auth)/login");
        } catch {
            Alert.alert(
                t("profile.logoutErrorTitle"),
                t("profile.logoutErrorMessage"),
            );
        } finally {
            setIsLoggingOut(false);
        }
    };

    const { level, nextLevel, progressPercent } =
        getLevelProgress(approvedReportsCount);
    const hasLoadedLevel = approvedReportsCount !== null;
    useEffect(() => {
        // Só aplica a cor quando o nível real é conhecido, evitando uma
        // transição intermediária para a cor do nível inicial.
        if (hasLoadedLevel) {
            setTitleColor(level.color);
        }
    }, [hasLoadedLevel, level.color, setTitleColor]);

    return (
        <View className="flex-1" style={{ backgroundColor: colors.background }}>
            {/* ── Top App Bar ── */}
            <ProfileTopAppBar
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
                {/* Recarregamentos ao voltar para a aba acontecem em segundo
                    plano: o indicador só aparece enquanto não há dados, para
                    o conteúdo não "pular" a cada foco. */}
                {isLoadingGamification && approvedReportsCount === null && (
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
                <ProfileMenu
                    onReportsPress={() => router.push("/profile/reports")}
                    onSettingsPress={() => router.push("/profile/settings")}
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

            <LogoutDialog
                visible={isLogoutDialogVisible}
                isLoggingOut={isLoggingOut}
                onClose={() => setIsLogoutDialogVisible(false)}
                onConfirm={handleLogout}
            />

            <AdministrativeNoticesPanel
                isVisible={isAdministrativeNoticesVisible}
                onClose={() => setIsAdministrativeNoticesVisible(false)}
                titleColor={titleColor}
            />
        </View>
    );
}
