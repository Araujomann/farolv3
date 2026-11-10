export type MapPlaceCategory = "Estabelecimento" | "Rua";

type MapPlaceSuggestionBase = {
    id: string;
    mapboxId: string;
    sessionToken: string;
    name: string;
    placeName: string;
    category: MapPlaceCategory;
};

export type MapPlaceSearchSuggestion = MapPlaceSuggestionBase;

export type MapPlaceSearchResult = MapPlaceSuggestionBase & {
    center: [number, number];
};

type PlaceContext = {
    country?: { country_code?: string; name?: string };
    district?: { name?: string };
    locality?: { name?: string };
    neighborhood?: { name?: string };
    place?: { name?: string };
};

type MapboxSuggestion = {
    mapbox_id?: string;
    name?: string;
    name_preferred?: string;
    feature_type?: string;
    address?: string;
    full_address?: string;
    place_formatted?: string;
    context?: PlaceContext;
};

type MapboxSuggestionsResponse = {
    suggestions?: MapboxSuggestion[];
};

type MapboxRetrieveResponse = {
    features?: {
        geometry?: { coordinates?: number[] };
        properties?: MapboxSuggestion;
    }[];
};

const IMPERATRIZ_CENTER = "-47.47812,-5.52693";

const normalizePlaceName = (value: string) =>
    value
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()
        .toLocaleLowerCase("pt-BR");

const belongsToImperatriz = (place: MapboxSuggestion) => {
    const cityNames = [
        place.context?.place?.name,
        place.context?.locality?.name,
    ].map((name) => normalizePlaceName(name ?? ""));
    const formattedLocation = (place.place_formatted ?? "")
        .split(",")
        .map(normalizePlaceName);

    return (
        cityNames.includes("imperatriz") ||
        formattedLocation.includes("imperatriz") ||
        (normalizePlaceName(place.name ?? "") === "imperatriz" &&
            normalizePlaceName(place.feature_type ?? "") === "place")
    );
};

const getPlaceCategory = (
    featureType?: string,
): MapPlaceCategory | undefined => {
    if (featureType === "poi") return "Estabelecimento";
    if (featureType === "street" || featureType === "address") return "Rua";
    return undefined;
};

const getAccessToken = () => {
    const token = process.env.EXPO_PUBLIC_MAPBOX_TOKEN;

    if (!token) {
        throw new Error("EXPO_PUBLIC_MAPBOX_TOKEN não foi encontrada.");
    }

    return token;
};

export const createMapboxSessionToken = () =>
    "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (character) => {
        const random = Math.floor(Math.random() * 16);
        const value = character === "x" ? random : (random & 0x3) | 0x8;
        return value.toString(16);
    });

export async function searchMapPlaces(
    query: string,
    sessionToken: string,
    signal?: AbortSignal,
): Promise<MapPlaceSearchSuggestion[]> {
    const params = new URLSearchParams({
        access_token: getAccessToken(),
        country: "BR",
        language: "pt",
        limit: "8",
        near: "Imperatriz, Maranhão",
        proximity: IMPERATRIZ_CENTER,
        session_token: sessionToken,
        types: "poi,street,address",
    });
    const response = await fetch(
        `https://api.mapbox.com/search/searchbox/v1/suggest?q=${encodeURIComponent(query.trim())}&${params.toString()}`,
        { signal },
    );

    if (!response.ok) {
        throw new Error(`Falha ao buscar lugares no mapa: ${response.status}`);
    }

    const data = (await response.json()) as MapboxSuggestionsResponse;

    return (data.suggestions ?? []).flatMap((suggestion) => {
        const mapboxId = suggestion.mapbox_id?.trim();
        const name = suggestion.name_preferred?.trim() || suggestion.name?.trim();
        const location = suggestion.full_address?.trim() ||
            suggestion.place_formatted?.trim();
        const category = getPlaceCategory(suggestion.feature_type);

        if (
            !mapboxId ||
            !name ||
            !location ||
            !category ||
            !belongsToImperatriz(suggestion)
        ) {
            return [];
        }

        return [
            {
                id: mapboxId,
                mapboxId,
                sessionToken,
                name,
                placeName: location,
                category,
            },
        ];
    });
}

export async function retrieveMapPlace(
    place: MapPlaceSearchSuggestion,
    signal?: AbortSignal,
): Promise<MapPlaceSearchResult> {
    const params = new URLSearchParams({
        access_token: getAccessToken(),
        language: "pt",
        session_token: place.sessionToken,
    });
    const response = await fetch(
        `https://api.mapbox.com/search/searchbox/v1/retrieve/${encodeURIComponent(place.mapboxId)}?${params.toString()}`,
        { signal },
    );

    if (!response.ok) {
        throw new Error(`Falha ao localizar o resultado: ${response.status}`);
    }

    const data = (await response.json()) as MapboxRetrieveResponse;
    const feature = data.features?.[0];
    const properties = feature?.properties;
    const [longitude, latitude] = feature?.geometry?.coordinates ?? [];
    const category = getPlaceCategory(properties?.feature_type);

    if (
        !properties ||
        !category ||
        !belongsToImperatriz(properties) ||
        typeof longitude !== "number" ||
        typeof latitude !== "number" ||
        !Number.isFinite(longitude) ||
        !Number.isFinite(latitude)
    ) {
        throw new Error("Não foi possível localizar esse lugar em Imperatriz.");
    }

    return {
        ...place,
        name: properties.name_preferred?.trim() || properties.name?.trim() || place.name,
        placeName:
            properties.full_address?.trim() ||
            properties.place_formatted?.trim() ||
            place.placeName,
        category,
        center: [longitude, latitude],
    };
}
