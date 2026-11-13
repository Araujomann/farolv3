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

    return {
        accidents,
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
