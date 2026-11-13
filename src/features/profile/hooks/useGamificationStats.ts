import { useCallback, useRef, useState } from "react";
import * as Notifications from "expo-notifications";
import { useFocusEffect } from "expo-router";

import { getMyGamificationStats } from "@/src/api/profile";
import { isAccidentApprovedNotification } from "@/src/features/notifications/pushNotifications";
import { useTranslation } from "@/src/i18n";

/**
 * Carrega a progressão do usuário sempre que a tela ganha foco e recarrega
 * quando chega a notificação de acidente aprovado. Respostas de requisições
 * antigas (ou que terminam após a tela perder o foco) são descartadas.
 */
export function useGamificationStats() {
    const { t } = useTranslation();
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
                setGamificationError(t("profile.progressError"));
            }
        } finally {
            if (requestId === gamificationRequestId.current) {
                setIsLoadingGamification(false);
            }
        }
    }, [t]);

    useFocusEffect(
        useCallback(() => {
            void loadGamification();
            const subscription =
                Notifications.addNotificationReceivedListener(
                    (notification) => {
                        if (isAccidentApprovedNotification(notification)) {
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

    return {
        approvedReportsCount,
        receivedTrustVotesCount,
        isLoadingGamification,
        gamificationError,
        loadGamification,
    };
}
