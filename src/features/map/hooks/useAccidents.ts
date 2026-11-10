import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { getAccidentsForMap } from "../services/accidentService";
import type { Accident, AccidentMapFilters } from "../types/accident.types";

export const useAccidents = () => {
    const [accidents, setAccidents] = useState<Accident[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filters, setFilters] = useState<AccidentMapFilters>({});
    const [reloadKey, setReloadKey] = useState(0);

    useEffect(() => {
        let isMounted = true;

        const loadAccidents = async () => {
            setIsLoading(true);
            setError(null);

            try {
                const nextAccidents = await getAccidentsForMap(filters);
                if (isMounted) setAccidents(nextAccidents);
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

                if (isMounted) {
                    setError("Não foi possível carregar os acidentes.");
                }
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };

        loadAccidents();

        return () => {
            isMounted = false;
        };
    }, [reloadKey, filters]);

    const applyFilters = useCallback((newFilters: AccidentMapFilters) => {
        setFilters(newFilters);
    }, []);

    const clearFilters = useCallback(() => {
        setFilters({});
    }, []);

    const retry = useCallback(() => {
        setReloadKey((current) => current + 1);
    }, []);

    return {
        accidents,
        isLoading,
        error,
        filters,
        applyFilters,
        clearFilters,
        retry,
    };
};
