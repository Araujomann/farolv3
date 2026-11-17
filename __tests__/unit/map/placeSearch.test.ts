import {
    createMapboxSessionToken,
    retrieveMapPlace,
    searchMapPlaces,
    type MapPlaceSearchSuggestion,
} from "@/src/features/map/services/placeSearch";

/**
 * A busca de lugares chama a API do Mapbox via `fetch`. O `fetch` é
 * substituído por respostas definidas no teste: nada sai para a internet.
 */
const fetchMock = jest.fn();

const jsonResponse = (body: unknown, status = 200) => ({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
});

const imperatrizContext = { place: { name: "Imperatriz" } };

beforeEach(() => {
    global.fetch = fetchMock as unknown as typeof fetch;
    process.env.EXPO_PUBLIC_MAPBOX_TOKEN = "pk.test-token";
});

describe("searchMapPlaces", () => {
    it("monta a consulta restrita ao Brasil e próxima de Imperatriz", async () => {
        fetchMock.mockResolvedValueOnce(jsonResponse({ suggestions: [] }));

        await searchMapPlaces("  Rua Ceará ", "session-1");

        const url = new URL(fetchMock.mock.calls[0][0]);
        expect(url.pathname).toBe("/search/searchbox/v1/suggest");
        expect(url.searchParams.get("q")).toBe("Rua Ceará");
        expect(url.searchParams.get("country")).toBe("BR");
        expect(url.searchParams.get("session_token")).toBe("session-1");
        expect(url.searchParams.get("access_token")).toBe("pk.test-token");
        expect(url.searchParams.get("types")).toBe("poi,street,address");
    });

    it("mantém só ruas e estabelecimentos de Imperatriz", async () => {
        fetchMock.mockResolvedValueOnce(
            jsonResponse({
                suggestions: [
                    {
                        mapbox_id: "poi-1",
                        name: "Hospital Municipal",
                        feature_type: "poi",
                        full_address: "Av. Bernardo Sayão, Imperatriz - MA",
                        context: imperatrizContext,
                    },
                    {
                        mapbox_id: "street-1",
                        name: "Rua Ceará",
                        feature_type: "street",
                        place_formatted: "Centro, Imperatriz, Maranhão",
                    },
                    {
                        mapbox_id: "street-2",
                        name: "Rua Ceará",
                        feature_type: "street",
                        place_formatted: "Centro, São Luís, Maranhão",
                        context: { place: { name: "São Luís" } },
                    },
                    {
                        mapbox_id: "region-1",
                        name: "Maranhão",
                        feature_type: "region",
                        place_formatted: "Imperatriz",
                    },
                    {
                        name: "Sem ID",
                        feature_type: "poi",
                        full_address: "Imperatriz",
                        context: imperatrizContext,
                    },
                ],
            }),
        );

        const results = await searchMapPlaces("rua", "session-1");

        expect(results).toEqual([
            {
                id: "poi-1",
                mapboxId: "poi-1",
                sessionToken: "session-1",
                name: "Hospital Municipal",
                placeName: "Av. Bernardo Sayão, Imperatriz - MA",
                category: "Estabelecimento",
            },
            {
                id: "street-1",
                mapboxId: "street-1",
                sessionToken: "session-1",
                name: "Rua Ceará",
                placeName: "Centro, Imperatriz, Maranhão",
                category: "Rua",
            },
        ]);
    });

    it("reconhece Imperatriz sem acento e com caixa diferente", async () => {
        fetchMock.mockResolvedValueOnce(
            jsonResponse({
                suggestions: [
                    {
                        mapbox_id: "addr-1",
                        name: "Rua 1",
                        feature_type: "address",
                        place_formatted: "IMPERATRIZ",
                        context: { locality: { name: "ímperatriz" } },
                    },
                ],
            }),
        );

        await expect(searchMapPlaces("rua", "s")).resolves.toHaveLength(1);
    });

    it("falha com o status quando o Mapbox responde erro", async () => {
        fetchMock.mockResolvedValueOnce(jsonResponse({}, 429));

        await expect(searchMapPlaces("rua", "s")).rejects.toThrow(
            "Falha ao buscar lugares no mapa: 429",
        );
    });

    it("exige o token do Mapbox", async () => {
        delete process.env.EXPO_PUBLIC_MAPBOX_TOKEN;

        await expect(searchMapPlaces("rua", "s")).rejects.toThrow(
            "EXPO_PUBLIC_MAPBOX_TOKEN não foi encontrada.",
        );
        expect(fetchMock).not.toHaveBeenCalled();
    });
});

describe("retrieveMapPlace", () => {
    const suggestion: MapPlaceSearchSuggestion = {
        id: "poi-1",
        mapboxId: "poi-1",
        sessionToken: "session-1",
        name: "Hospital",
        placeName: "Imperatriz",
        category: "Estabelecimento",
    };

    it("devolve o lugar com as coordenadas [longitude, latitude]", async () => {
        fetchMock.mockResolvedValueOnce(
            jsonResponse({
                features: [
                    {
                        geometry: { coordinates: [-47.48, -5.52] },
                        properties: {
                            name: "Hospital Municipal",
                            feature_type: "poi",
                            full_address: "Av. Bernardo Sayão, Imperatriz",
                            context: imperatrizContext,
                        },
                    },
                ],
            }),
        );

        const place = await retrieveMapPlace(suggestion);

        expect(place).toMatchObject({
            name: "Hospital Municipal",
            placeName: "Av. Bernardo Sayão, Imperatriz",
            category: "Estabelecimento",
            center: [-47.48, -5.52],
        });
        expect(fetchMock.mock.calls[0][0]).toContain("/retrieve/poi-1?");
    });

    it.each([
        ["sem resultados", { features: [] }],
        [
            "fora de Imperatriz",
            {
                features: [
                    {
                        geometry: { coordinates: [-44.3, -2.5] },
                        properties: {
                            name: "X",
                            feature_type: "poi",
                            context: { place: { name: "São Luís" } },
                        },
                    },
                ],
            },
        ],
        [
            "sem coordenadas válidas",
            {
                features: [
                    {
                        geometry: { coordinates: [] },
                        properties: {
                            name: "X",
                            feature_type: "poi",
                            context: imperatrizContext,
                        },
                    },
                ],
            },
        ],
    ])("recusa resposta %s", async (_label, body) => {
        fetchMock.mockResolvedValueOnce(jsonResponse(body));

        await expect(retrieveMapPlace(suggestion)).rejects.toThrow(
            "Não foi possível localizar esse lugar em Imperatriz.",
        );
    });
});

describe("createMapboxSessionToken", () => {
    it("gera um UUID v4", () => {
        expect(createMapboxSessionToken()).toMatch(
            /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
        );
    });
});
