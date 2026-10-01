export type AccidentSeverity = "low" | "medium" | "high" | "critical" | "unknown";

export type Accident = {
    id: string;
    latitude: number;
    longitude: number;
    severity: AccidentSeverity;
    type?: string;
};

export type AccidentApiRecord = {
    id?: string | number;
    _id?: string;
    latitude?: number | string;
    longitude?: number | string;
    lat?: number | string;
    lng?: number | string;
    severity?: string | number;
    type?: string;
    location?: {
        latitude?: number | string;
        longitude?: number | string;
        coordinates?: [number | string, number | string];
    };
    coordinates?: [number | string, number | string];
};

export type AccidentApiResponse =
    | AccidentApiRecord[]
    | { data?: AccidentApiRecord[] | { accidents?: AccidentApiRecord[]; results?: AccidentApiRecord[] } };