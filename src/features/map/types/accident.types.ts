export type AccidentSeverity =
    | "low"
    | "medium"
    | "high"
    | "critical"
    | "unknown";

export type AccidentClassification = "com_vitima" | "sem_vitima";
export type AccidentWeatherCondition = "ceu_claro" | "chuva" | "nublado" | "garoa";
export type AccidentSource = "APP" | "PRF";

export type Accident = {
    id: string;
    tipo_acidente: string;
    classificacao_acidente: AccidentClassification;
    condicao_meteorologica: AccidentWeatherCondition;
    latitude: number;
    longitude: number;
    occurred_at: string;
    severity: AccidentSeverity;
    source: AccidentSource;
};

export type AccidentMapFilters = {
    search?: string;
    severity?: AccidentSeverity;
    classificacao?: AccidentClassification;
    condicao_meteorologica?: AccidentWeatherCondition;
    source?: AccidentSource;
    source_year?: number;
    from?: string;
    to?: string;
};

export type AccidentMapResponse = {
    data: Accident[];
    total: number;
};
