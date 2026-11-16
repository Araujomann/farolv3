import { useEffect, useState, useCallback, useRef } from "react";
import axios from "axios";
import { tr } from "@/src/i18n";
import {
    getAccidentsForMap,
    getAccidentsMapVersion,
} from "../services/accidentService";
import type { Accident, AccidentMapFilters } from "../types/accident.types";

type AccidentsMapCache = {
    filters: AccidentMapFilters;
    filtersKey: string;
    accidents: Accident[];
    /** Server version of the data; null when it could not be fetched. */
    version: string | null;
};

/**
 * Kept at module level so the map data survives the screen being
 * unmounted while the app is open. Cleared only when the JS runtime restarts.
 */
let mapCache: AccidentsMapCache | null = null;

const getFiltersKey = (filters: AccidentMapFilters) => JSON.stringify(filters);

const fetchVersionSafely = async () => {
    try {
        return await getAccidentsMapVersion();
    } catch {
        return null;
    }
};

export const useAccidents = () => {
    const [accidents, setAccidents] = useState<Accident[]>(
        () => mapCache?.accidents ?? [],
    );
    const [isLoading, setIsLoading] = useState(() => mapCache === null);
    const [error, setError] = useState<string | null>(null);
    const [filters, setFilters] = useState<AccidentMapFilters>(
        () => mapCache?.filters ?? {},
    );
    const [reloadKey, setReloadKey] = useState(0);
    const requestId = useRef(0);
    const isCheckingVersion = useRef(false);

    const loadAccidents = useCallback(
        async (silent = false) => {
            const currentRequestId = ++requestId.current;
            if (!silent) {
                setIsLoading(true);
                setError(null);
            }

            try {
                const [nextAccidents, version] = await Promise.all([
                    getAccidentsForMap(filters),
                    fetchVersionSafely(),
                ]);
                if (requestId.current === currentRequestId) {
                    mapCache = {
                        filters,
                        filtersKey: getFiltersKey(filters),
                        accidents: nextAccidents,
                        version,
                    };
                    setAccidents(nextAccidents);
                    setError(null);
                }
            } catch (error) {
                if (__DEV__) {
                    if (axios.isAxiosError(error)) {
                        console.warn("Falha ao carregar acidentes do mapa", {
                            url: error.config?.url,
                            baseURL: error.config?.baseURL,
                            status: error.response?.status,
                            response: error.response?.data,
                            message: error.message,
                        });
                    } else {
                        console.warn(
                            "Falha ao carregar acidentes do mapa",
                            error,
                        );
                    }
                }

                // A failed background refresh keeps the map that is already shown.
                if (requestId.current === currentRequestId && !silent) {
                    setError(tr("map.loadError"));
                }
            } finally {
                if (requestId.current === currentRequestId && !silent) {
                    setIsLoading(false);
                }
            }
        },
        [filters],
    );

    useEffect(() => {
        const hasCachedData =
            reloadKey === 0 &&
            mapCache !== null &&
            mapCache.filtersKey === getFiltersKey(filters);

        if (!hasCachedData) {
            void loadAccidents();
        }

        return () => {
            requestId.current += 1;
        };
    }, [filters, loadAccidents, reloadKey]);

    const applyFilters = useCallback((newFilters: AccidentMapFilters) => {
        setFilters(newFilters);
    }, []);

    const clearFilters = useCallback(() => {
        setFilters({});
    }, []);

    const retry = useCallback(() => {
        setReloadKey((current) => current + 1);
    }, []);

    const refreshSilently = useCallback(() => {
        void loadAccidents(true);
    }, [loadAccidents]);

    /**
     * Asks the API only for the data version and downloads the accidents
     * again, in the background, when something changed since the cache.
     */
    const checkForUpdates = useCallback(async () => {
        if (!mapCache || isCheckingVersion.current) return;

        isCheckingVersion.current = true;
        try {
            const version = await fetchVersionSafely();
            if (version === null || version !== mapCache?.version) {
                await loadAccidents(true);
            }
        } finally {
            isCheckingVersion.current = false;
        }
    }, [loadAccidents]);

    /**
     * Garante que um acidente (ex.: recém-aprovado, vindo de uma notificação)
     * esteja na lista do mapa. Baixa os dados de novo e, se os filtros atuais
     * o escondem, limpa os filtros. Devolve o acidente, ou null se não achar.
     */
    const revealAccident = useCallback(
        async (accidentId: string): Promise<Accident | null> => {
            const find = (list: Accident[]) =>
                list.find((accident) => accident.id === accidentId) ?? null;

            const candidates =
                Object.keys(filters).length > 0 ? [filters, {}] : [filters];

            try {
                for (const [index, candidate] of candidates.entries()) {
                    const [nextAccidents, version] = await Promise.all([
                        getAccidentsForMap(candidate),
                        fetchVersionSafely(),
                    ]);
                    const found = find(nextAccidents);
                    if (!found && index < candidates.length - 1) continue;

                    // Descarta cargas em andamento: esta resposta é a mais nova.
                    requestId.current += 1;
                    mapCache = {
                        filters: candidate,
                        filtersKey: getFiltersKey(candidate),
                        accidents: nextAccidents,
                        version,
                    };
                    setFilters(candidate);
                    setAccidents(nextAccidents);
                    setError(null);
                    setIsLoading(false);
                    return found;
                }
            } catch (error) {
                if (__DEV__) {
                    console.warn("Falha ao localizar o acidente no mapa", error);
                }
            }

            return null;
        },
        [filters],
    );

    return {
        accidents,
        revealAccident,
        isLoading,
        error,
        filters,
        applyFilters,
        clearFilters,
        retry,
        refreshSilently,
        checkForUpdates,
    };
};
