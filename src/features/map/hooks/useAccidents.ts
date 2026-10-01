import { useEffect, useState } from "react";
import { getAccidents } from "../services/accidentService";
import { Accident } from "../types/accident.types";

export const useAccidents = () => {
    const [accidents, setAccidents] = useState<Accident[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [reloadKey, setReloadKey] = useState(0);

    useEffect(() => {
        let isMounted = true;

        const loadAccidents = async () => {
            setIsLoading(true);
            setError(null);

            try {
                const nextAccidents = await getAccidents();
                if (isMounted) setAccidents(nextAccidents);
            } catch {
                if (isMounted) setError("Não foi possível carregar os acidentes.");
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };

        loadAccidents();

        return () => {
            isMounted = false;
        };
    }, [reloadKey]);

    return {
        accidents,
        isLoading,
        error,
        retry: () => setReloadKey((current) => current + 1),
    };
};