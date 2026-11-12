import { isAxiosError } from "axios";
import { getAccidentsForMap } from "@/src/features/map/services/accidentService";
import { api } from "./client";

export type AccidentSeverity = "low" | "medium" | "high" | "critical";

export type AccidentOverview = {
    approved_accidents_count: number;
    accidents_with_victims_count: number;
    high_severity_accidents_count: number;
    current_30_days_count: number;
    previous_30_days_count: number;
    severity_distribution: Record<AccidentSeverity, number>;
    time_of_day: {
        start_hour: number;
        count: number;
    }[];
    recent_accidents: {
        id: string;
        tipo_acidente: string;
        classificacao_acidente: "com_vitima" | "sem_vitima";
        occurred_at: string;
        severity: AccidentSeverity;
        source: "APP" | "PRF";
    }[];
};

type AccidentOverviewResponse = {
    data: AccidentOverview;
};

export const getAccidentOverview = async (): Promise<AccidentOverview> => {
    try {
        const response = await api.get<AccidentOverviewResponse>(
            "/accidents/overview",
        );

        return response.data.data;
    } catch (error) {
        if (
            !isAxiosError(error) ||
            error.response?.status !== 404
        ) {
            throw error;
        }

        return getOverviewFromMapData();
    }
};

const OVERVIEW_PERIOD_IN_DAYS = 30;
const MAP_ACCIDENTS_MAX_RESULTS = 5000;
const overviewHourFormatter = new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    hourCycle: "h23",
    timeZone: "America/Sao_Paulo",
});

function isAccidentSeverity(
    severity: string,
): severity is AccidentSeverity {
    return (
        severity === "low" ||
        severity === "medium" ||
        severity === "high" ||
        severity === "critical"
    );
}

async function getOverviewFromMapData(): Promise<AccidentOverview> {
    const accidents = await getAccidentsForMap();

    if (accidents.length >= MAP_ACCIDENTS_MAX_RESULTS) {
        throw new Error(
            "O panorama completo ainda não está disponível. A fonte atual atingiu o limite de registros; atualize a API para ver estatísticas completas.",
        );
    }

    const now = Date.now();
    const currentPeriodStart =
        now - OVERVIEW_PERIOD_IN_DAYS * 24 * 60 * 60 * 1000;
    const previousPeriodStart =
        now - 2 * OVERVIEW_PERIOD_IN_DAYS * 24 * 60 * 60 * 1000;
    const severityDistribution: Record<AccidentSeverity, number> = {
        low: 0,
        medium: 0,
        high: 0,
        critical: 0,
    };
    const timeOfDayCounts = Array.from({ length: 8 }, () => 0);
    let accidentsWithVictims = 0;
    let highSeverityAccidents = 0;
    let currentPeriodCount = 0;
    let previousPeriodCount = 0;

    for (const accident of accidents) {
        const occurredAt = new Date(accident.occurred_at);
        const occurredAtTime = occurredAt.getTime();
        if (!Number.isFinite(occurredAtTime)) {
            throw new Error(
                "A lista de acidentes contém uma data inválida; não foi possível calcular o panorama.",
            );
        }

        if (!isAccidentSeverity(accident.severity)) {
            throw new Error(
                "A lista de acidentes contém uma gravidade desconhecida; não foi possível calcular o panorama.",
            );
        }

        severityDistribution[accident.severity] += 1;
        if (accident.classificacao_acidente === "com_vitima") {
            accidentsWithVictims += 1;
        }
        if (
            accident.severity === "high" ||
            accident.severity === "critical"
        ) {
            highSeverityAccidents += 1;
        }
        if (occurredAtTime >= currentPeriodStart && occurredAtTime <= now) {
            currentPeriodCount += 1;
            const hour = Number(overviewHourFormatter.format(occurredAt));
            timeOfDayCounts[Math.floor(hour / 3)] += 1;
        } else if (
            occurredAtTime >= previousPeriodStart &&
            occurredAtTime < currentPeriodStart
        ) {
            previousPeriodCount += 1;
        }
    }

    return {
        approved_accidents_count: accidents.length,
        accidents_with_victims_count: accidentsWithVictims,
        high_severity_accidents_count: highSeverityAccidents,
        current_30_days_count: currentPeriodCount,
        previous_30_days_count: previousPeriodCount,
        severity_distribution: severityDistribution,
        time_of_day: timeOfDayCounts.map((count, index) => ({
            start_hour: index * 3,
            count,
        })),
        recent_accidents: accidents.slice(0, 5).map((accident) => {
            if (!isAccidentSeverity(accident.severity)) {
                throw new Error(
                    "A lista de acidentes contém uma gravidade desconhecida; não foi possível exibir os registros recentes.",
                );
            }

            return {
                id: accident.id,
                tipo_acidente: accident.tipo_acidente,
                classificacao_acidente: accident.classificacao_acidente,
                occurred_at: accident.occurred_at,
                severity: accident.severity,
                source: accident.source,
            };
        }),
    };
}
