import { api } from "@/src/api/client";
import {
    Accident,
    AccidentApiRecord,
    AccidentApiResponse,
    AccidentSeverity,
} from "../types/accident.types";

const normalizeSeverity = (severity: AccidentApiRecord["severity"]): AccidentSeverity => {
    const value = String(severity ?? "").toLowerCase();

    if (["low", "baixa", "1"].includes(value)) return "low";
    if (["medium", "moderate", "media", "média", "2"].includes(value)) return "medium";
    if (["high", "alta", "3"].includes(value)) return "high";
    if (["critical", "critica", "crítica", "4"].includes(value)) return "critical";

    return "unknown";
};

const getRecords = (response: AccidentApiResponse): AccidentApiRecord[] => {
    if (Array.isArray(response)) return response;
    if (Array.isArray(response.data)) return response.data;
    if (response.data?.accidents) return response.data.accidents;
    if (response.data?.results) return response.data.results;
    return [];
};

const getCoordinates = (record: AccidentApiRecord) => {
    if (record.coordinates?.length === 2) {
        return {
            longitude: Number(record.coordinates[0]),
            latitude: Number(record.coordinates[1]),
        };
    }

    if (record.location?.coordinates?.length === 2) {
        return {
            longitude: Number(record.location.coordinates[0]),
            latitude: Number(record.location.coordinates[1]),
        };
    }

    return {
        latitude: Number(record.latitude ?? record.lat ?? record.location?.latitude),
        longitude: Number(record.longitude ?? record.lng ?? record.location?.longitude),
    };
};

const isValidCoordinate = (latitude: number, longitude: number) =>
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180;

const normalizeAccident = (record: AccidentApiRecord, index: number): Accident | null => {
    const { latitude, longitude } = getCoordinates(record);

    if (!isValidCoordinate(latitude, longitude)) return null;

    return {
        id: String(record.id ?? record._id ?? `accident-${index}`),
        latitude,
        longitude,
        severity: normalizeSeverity(record.severity),
        type: record.type,
    };
};

export const getAccidents = async (): Promise<Accident[]> => {
    const response = await api.get<AccidentApiResponse>("/accidents");

    return getRecords(response.data)
        .map(normalizeAccident)
        .filter((accident): accident is Accident => accident !== null);
};