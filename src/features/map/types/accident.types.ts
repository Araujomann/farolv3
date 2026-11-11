export type AccidentSeverity =
    | "low"
    | "medium"
    | "high"
    | "critical"
    | "unknown";

export type AccidentClassification = "com_vitima" | "sem_vitima";
export type AccidentWeatherCondition = "ceu_claro" | "chuva" | "nublado" | "garoa";
export type AccidentSource = "APP" | "PRF";

export type CreateAccidentInput = {
    tipo_acidente: string;
    classificacao_acidente: AccidentClassification;
    condicao_meteorologica: AccidentWeatherCondition;
    description?: string;
    latitude: number;
    longitude: number;
    occurredAt: string;
    severity: Exclude<AccidentSeverity, "unknown">;
};

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

export type AccidentComment = {
    id: string;
    accident_id: string;
    created_by_id: string;
    author_name: string | null;
    body: string;
    created_at: string;
    updated_at: string;
};

export type AccidentImage = {
    id: string;
    image_url: string;
    caption: string | null;
};

export type AccidentDetail = Accident & {
    description: string | null;
    created_by_id: string | null;
    created_at: string;
    moderation_status: "APPROVED" | "PENDING" | "REJECTED";
    trusted_count?: number;
    comments: AccidentComment[];
    images: AccidentImage[];
};

export type AccidentTrustSummary = {
    trusted_count: number;
    trusted_by_me: boolean;
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
