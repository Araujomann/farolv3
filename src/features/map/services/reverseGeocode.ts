type ReverseGeocodeResponse = {
    features?: Array<{
        place_name?: string;
    }>;
};

export async function reverseGeocode(
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
