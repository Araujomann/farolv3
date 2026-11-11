import { api } from "@/src/api/client";
import type {
    Accident,
    AccidentComment,
    AccidentDetail,
    AccidentMapFilters,
    AccidentMapResponse,
    AccidentTrustSummary,
    CreateAccidentInput,
} from "../types/accident.types";

const MOJIBAKE_MARKERS = /(?:Ã.|Â.|â.|�)/;

const repairMojibake = (value: string): string => {
    if (!MOJIBAKE_MARKERS.test(value)) return value;

    try {
        const bytes = Uint8Array.from(value, (character) =>
            character.charCodeAt(0),
        );
        const repaired = new TextDecoder("utf-8").decode(bytes);
        return repaired.includes("�") ? value : repaired;
    } catch {
        return value;
    }
};

const normalizeAccident = (accident: Accident): Accident => ({
    ...accident,
    tipo_acidente: repairMojibake(accident.tipo_acidente),
});

const buildQueryParams = (filters: AccidentMapFilters): Record<string, string> => {
    const params: Record<string, string> = {};

    if (filters.search) params.search = filters.search;
    if (filters.severity) params.severity = filters.severity;
    if (filters.classificacao) params.classificacao = filters.classificacao;
    if (filters.condicao_meteorologica) params.condicao_meteorologica = filters.condicao_meteorologica;
    if (filters.source) params.source = filters.source;
    if (filters.source_year !== undefined) params.source_year = String(filters.source_year);
    if (filters.from) params.from = filters.from;
    if (filters.to) params.to = filters.to;

    return params;
};

export const getAccidentsForMap = async (
    filters: AccidentMapFilters = {},
): Promise<Accident[]> => {
    const params = buildQueryParams(filters);
    const response = await api.get<AccidentMapResponse>("/accidents/map", { params });

    return response.data.data.map(normalizeAccident);
};

export const createAccident = async (input: CreateAccidentInput) => {
    const response = await api.post<{ data: Accident }>("/accidents/", input);

    return response.data.data;
};

export const getAccidentDetails = async (
    accidentId: string,
): Promise<AccidentDetail> => {
    const response = await api.get<{ data: AccidentDetail }>(
        `/accidents/${encodeURIComponent(accidentId)}`,
    );

    return {
        ...response.data.data,
        tipo_acidente: repairMojibake(response.data.data.tipo_acidente),
    };
};

export const createAccidentComment = async (
    accidentId: string,
    body: string,
): Promise<AccidentComment> => {
    const response = await api.post<{ data: AccidentComment }>(
        `/accidents/${encodeURIComponent(accidentId)}/comments`,
        { body },
    );

    return response.data.data;
};

export const getAccidentTrust = async (
    accidentId: string,
): Promise<AccidentTrustSummary> => {
    const response = await api.get<{ data: AccidentTrustSummary }>(
        `/accidents/${encodeURIComponent(accidentId)}/trust`,
    );

    return response.data.data;
};

export const setAccidentTrust = async (
    accidentId: string,
    trusted: boolean,
): Promise<AccidentTrustSummary> => {
    const url = `/accidents/${encodeURIComponent(accidentId)}/trust`;
    const response = trusted
        ? await api.post<{ data: AccidentTrustSummary }>(url)
        : await api.delete<{ data: AccidentTrustSummary }>(url);

    return response.data.data;
};
