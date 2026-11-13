import { CarFront, PersonStanding, Shapes } from "lucide-react-native";

import type {
    AccidentClassification,
    AccidentSeverity,
    AccidentWeatherCondition,
} from "@/src/features/map/types/accident.types";
import type { TranslationKey } from "@/src/i18n";
import { SEVERITY_COLORS } from "@/src/theme/colors";

export const MAX_DESCRIPTION_LENGTH = 1000;
export const MAX_CUSTOM_TYPE_LENGTH = 60;

/** Severidades que o usuário pode escolher ao relatar. */
export type ReportSeverity = Exclude<AccidentSeverity, "unknown">;

export const SEVERITY_OPTIONS: {
    value: ReportSeverity;
    label: TranslationKey;
    color: string;
}[] = [
    { value: "low", label: "enums.severity.low", color: SEVERITY_COLORS.low },
    { value: "medium", label: "enums.severity.medium", color: SEVERITY_COLORS.medium },
    { value: "high", label: "enums.severity.high", color: SEVERITY_COLORS.high },
    { value: "critical", label: "enums.severity.critical", color: SEVERITY_COLORS.critical },
];

export const ACCIDENT_TYPES = ["COLISÃO", "ATROPELAMENTO", "OUTRO"] as const;

export type ReportAccidentType = (typeof ACCIDENT_TYPES)[number];

export const CLASSIFICATION_OPTIONS: {
    value: AccidentClassification;
    label: TranslationKey;
}[] = [
    { value: "sem_vitima", label: "enums.classification.sem_vitima" },
    { value: "com_vitima", label: "enums.classification.com_vitima" },
];

export const WEATHER_OPTIONS: {
    value: AccidentWeatherCondition;
    label: TranslationKey;
}[] = [
    { value: "ceu_claro", label: "enums.weather.ceu_claro" },
    { value: "nublado", label: "enums.weather.nublado" },
    { value: "garoa", label: "enums.weather.garoa" },
    { value: "chuva", label: "enums.weather.chuva" },
];

export const ACCIDENT_TYPE_ICONS = {
    COLISÃO: CarFront,
    ATROPELAMENTO: PersonStanding,
    OUTRO: Shapes,
} as const;
