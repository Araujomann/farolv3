import { useEffect, useState, useCallback, useRef } from "react";
import axios from "axios";
import { getAccidentsForMap } from "../services/accidentService";
import type { Accident, AccidentMapFilters } from "../types/accident.types";

export const useAccidents = () => {
    const [accidents, setAccidents] = useState<Accident[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filters, setFilters] = useState<AccidentMapFilters>({});
    const [reloadKey, setReloadKey] = useState(0);
    const requestId = useRef(0);

    const loadAccidents = useCallback(async (silent = false) => {
        const currentRequestId = ++requestId.current;
        if (!silent) {
            setIsLoading(true);
            setError(null);
        }

        try {
            const nextAccidents = await getAccidentsForMap(filters);
            if (requestId.current === currentRequestId) {
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
                    console.warn("Falha ao carregar acidentes do mapa", error);
                }
            }

            if (requestId.current === currentRequestId) {
                setError("Não foi possível carregar os acidentes.");
            }
        } finally {
            if (requestId.current === currentRequestId) {
                setIsLoading(false);
            }
        }
    }, [filters]);

    useEffect(() => {
        void loadAccidents();

        return () => {
            requestId.current += 1;
        };
    }, [loadAccidents, reloadKey]);

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

    return {
        accidents,
        isLoading,
        error,
        filters,
        applyFilters,
        clearFilters,
        retry,
        refreshSilently,
    };
};
