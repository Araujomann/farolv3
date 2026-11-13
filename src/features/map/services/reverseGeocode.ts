type ReverseGeocodeResponse = {
    features?: Array<{
        place_name?: string;
    }>;
};

/**
 * Endereços já resolvidos (ou em resolução), por coordenada. Evita refazer
 * a mesma chamada ao Mapbox quando a lista de relatos re-renderiza, quando o
 * usuário volta à tela ou quando duas telas pedem o mesmo ponto.
 * ~5 casas decimais ≈ 1 m — mais que suficiente para um endereço.
 */
const addressCache = new Map<string, Promise<string>>();
const MAX_CACHE_ENTRIES = 300;

const getCacheKey = (longitude: number, latitude: number) =>
    `${longitude.toFixed(5)},${latitude.toFixed(5)}`;

export function reverseGeocode(
    longitude: number,
    latitude: number,
): Promise<string> {
    const key = getCacheKey(longitude, latitude);
    const cached = addressCache.get(key);
    if (cached) return cached;

    const request = fetchAddress(longitude, latitude).catch((error) => {
        // Falhas não ficam em cache: a próxima tentativa refaz a chamada.
        addressCache.delete(key);
        throw error;
    });

    if (addressCache.size >= MAX_CACHE_ENTRIES) {
        const oldestKey = addressCache.keys().next().value;
        if (oldestKey !== undefined) addressCache.delete(oldestKey);
    }
    addressCache.set(key, request);
    return request;
}

async function fetchAddress(
    longitude: number,
    latitude: number,
): Promise<string> {
    const token = process.env.EXPO_PUBLIC_MAPBOX_TOKEN;

    if (!token) {
        throw new Error("EXPO_PUBLIC_MAPBOX_TOKEN não foi encontrada.");
    }

    const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?language=pt-BR&limit=1&access_token=${encodeURIComponent(token)}`,
    );

    if (!response.ok) {
        throw new Error(`Falha na geocodificação: ${response.status}`);
    }

    const data = (await response.json()) as ReverseGeocodeResponse;
    const address = data.features?.[0]?.place_name?.trim();

    if (!address) {
        throw new Error("Nenhum endereço foi encontrado para esta localização.");
    }

    return address;
}
