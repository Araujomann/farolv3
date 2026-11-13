import { useCallback, useRef, useState } from "react";
import * as Notifications from "expo-notifications";
import { useFocusEffect } from "expo-router";

import { getAccidentOverview } from "@/src/api/accidents";
import type { AccidentOverview } from "@/src/api/accidents";
import { getMyGamificationStats } from "@/src/api/profile";
import type { GamificationStats } from "@/src/api/profile";
import { FOCUS_REFRESH_INTERVAL_MS } from "@/src/features/home/constants";
import {
    validateOverview,
    validatePersonalStats,
} from "@/src/features/home/utils/validateDashboard";
import { isAccidentApprovedNotification } from "@/src/features/notifications/pushNotifications";
import { useTranslation } from "@/src/i18n";

/**
 * Carrega o panorama da comunidade e as estatísticas pessoais da Home.
 * Recarrega ao ganhar foco (se os dados estiverem velhos) e quando chega a
 * notificação de acidente aprovado; respostas antigas são descartadas.
 */
export function useHomeDashboard() {
    const { t } = useTranslation();
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
                        if (isAccidentApprovedNotification(notification)) {
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

    return {
        overview,
        personalStats,
        isLoading,
        isRefreshing,
        communityError,
        personalError,
        /** Lido durante a renderização, como a tela fazia com o ref. */
        hasLoaded: hasLoaded.current,
        loadDashboard,
    };
}
