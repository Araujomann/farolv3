import { useCallback, useEffect, useRef, useState } from "react";

import {
    countAccidentsByTimeOfDay,
    type AccidentOverview,
} from "@/src/api/accidents";
import { getAccidentsForMap } from "@/src/features/map/services/accidentService";
import {
    getTemporalPeriodRange,
    TEMPORAL_PERIOD_OPTIONS,
    type TemporalPeriod,
} from "@/src/features/map/utils/temporalPeriod";

/** "last30Days" é o período que já vem calculado no panorama da API. */
export type TimeOfDayPeriod = "last30Days" | TemporalPeriod;

type TimeOfDay = AccidentOverview["time_of_day"];

/**
 * Faixas de horário do período escolhido. Os últimos 30 dias vêm do
 * panorama; os demais períodos (os mesmos do filtro do mapa) são contados a
 * partir de `GET /accidents/map` com `from`/`to`. Recarrega quando o
 * panorama é atualizado e descarta respostas de seleções anteriores.
 */
export function useTimeOfDayStats(overviewTimeOfDay: TimeOfDay) {
    const [period, setPeriod] = useState<TimeOfDayPeriod>("last30Days");
    const [periodData, setPeriodData] = useState<TimeOfDay | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [hasError, setHasError] = useState(false);
    const requestId = useRef(0);

    const load = useCallback(async (selected: TimeOfDayPeriod) => {
        const currentRequestId = ++requestId.current;
        if (selected === "last30Days") {
            setPeriodData(null);
            setIsLoading(false);
            setHasError(false);
            return;
        }

        const option = TEMPORAL_PERIOD_OPTIONS.find(
            (item) => item.value === selected,
        );
        if (!option) return;

        setIsLoading(true);
        setHasError(false);
        try {
            const accidents = await getAccidentsForMap(
                getTemporalPeriodRange(option.months),
            );
            if (requestId.current !== currentRequestId) return;
            setPeriodData(countAccidentsByTimeOfDay(accidents));
        } catch (error) {
            if (requestId.current !== currentRequestId) return;
            if (__DEV__) {
                console.warn("Falha ao carregar acidentes por horário", error);
            }
            setHasError(true);
        } finally {
            if (requestId.current === currentRequestId) setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        void load(period);
        // Recarrega também quando o panorama da Home é atualizado.
    }, [load, period, overviewTimeOfDay]);

    return {
        period,
        setPeriod,
        timeOfDay: period === "last30Days" ? overviewTimeOfDay : periodData,
        isLoading,
        hasError,
        retry: () => void load(period),
    };
}
