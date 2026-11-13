import { useCallback, useRef, useState } from "react";
import { useFocusEffect } from "expo-router";

import { getMyReports, type MyReport, type ReportStatus } from "@/src/api/reports";
import { useTranslation } from "@/src/i18n";

const PAGE_SIZE = 20;

/**
 * Relatos do usuário no status informado, paginados. Recarrega do zero ao
 * ganhar foco ou ao trocar de status; respostas antigas são descartadas.
 */
export function useMyReports(status: ReportStatus) {
    const { t } = useTranslation();
    const requestId = useRef(0);
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

    return {
        reports,
        page,
        totalPages,
        isLoading,
        isLoadingMore,
        error,
        loadMoreError,
        loadReports,
        loadMore,
    };
}
