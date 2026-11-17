/**
 * Geocodificação reversa (coordenadas → endereço) via Mapbox, com cache em
 * memória no módulo. Cada teste carrega uma cópia nova do módulo para que
 * o cache de um teste não interfira no seguinte. O `fetch` é simulado.
 */
type ReverseGeocode = typeof import("@/src/features/map/services/reverseGeocode").reverseGeocode;

const fetchMock = jest.fn();

const addressResponse = (placeName?: string, status = 200) => ({
    ok: status === 200,
    status,
    json: async () => ({
        features: placeName === undefined ? [] : [{ place_name: placeName }],
    }),
});

let reverseGeocode: ReverseGeocode;

beforeEach(() => {
    global.fetch = fetchMock as unknown as typeof fetch;
    process.env.EXPO_PUBLIC_MAPBOX_TOKEN = "pk.test-token";
    jest.isolateModules(() => {
        reverseGeocode =
            require("@/src/features/map/services/reverseGeocode").reverseGeocode;
    });
});

it("devolve o endereço sem espaços nas pontas", async () => {
    fetchMock.mockResolvedValueOnce(addressResponse("  Rua Ceará, Imperatriz  "));

    await expect(reverseGeocode(-47.47812, -5.52693)).resolves.toBe(
        "Rua Ceará, Imperatriz",
    );
    expect(fetchMock.mock.calls[0][0]).toContain(
        "/mapbox.places/-47.47812,-5.52693.json?language=pt-BR",
    );
});

it("reaproveita a resposta para a mesma coordenada (≈1 m)", async () => {
    fetchMock.mockResolvedValueOnce(addressResponse("Rua A"));

    await reverseGeocode(-47.478121, -5.526931);
    await reverseGeocode(-47.478124, -5.526934);

    expect(fetchMock).toHaveBeenCalledTimes(1);
});

it("compartilha a mesma requisição entre chamadas simultâneas", async () => {
    fetchMock.mockResolvedValueOnce(addressResponse("Rua A"));

    const [first, second] = await Promise.all([
        reverseGeocode(-47.1, -5.1),
        reverseGeocode(-47.1, -5.1),
    ]);

    expect(first).toBe("Rua A");
    expect(second).toBe("Rua A");
    expect(fetchMock).toHaveBeenCalledTimes(1);
});

it("não guarda falhas em cache: a próxima chamada tenta de novo", async () => {
    fetchMock
        .mockResolvedValueOnce(addressResponse(undefined, 500))
        .mockResolvedValueOnce(addressResponse("Rua B"));

    await expect(reverseGeocode(-47.2, -5.2)).rejects.toThrow(
        "Falha na geocodificação: 500",
    );
    await expect(reverseGeocode(-47.2, -5.2)).resolves.toBe("Rua B");
    expect(fetchMock).toHaveBeenCalledTimes(2);
});

it("falha quando o Mapbox não encontra endereço", async () => {
    fetchMock.mockResolvedValueOnce(addressResponse(undefined));

    await expect(reverseGeocode(-47.3, -5.3)).rejects.toThrow(
        "Nenhum endereço foi encontrado para esta localização.",
    );
});

it("falha sem chamar a rede quando falta o token", async () => {
    delete process.env.EXPO_PUBLIC_MAPBOX_TOKEN;

    await expect(reverseGeocode(-47.4, -5.4)).rejects.toThrow(
        "EXPO_PUBLIC_MAPBOX_TOKEN não foi encontrada.",
    );
    expect(fetchMock).not.toHaveBeenCalled();
});

it("limita o cache a 300 coordenadas descartando a mais antiga", async () => {
    fetchMock.mockImplementation(async () => addressResponse("Rua"));

    for (let index = 0; index < 301; index += 1) {
        await reverseGeocode(-47 - index / 1000, -5);
    }
    fetchMock.mockClear();

    await reverseGeocode(-47 - 300 / 1000, -5); // mais recente: em cache
    expect(fetchMock).not.toHaveBeenCalled();

    await reverseGeocode(-47, -5); // a primeira foi descartada
    expect(fetchMock).toHaveBeenCalledTimes(1);
});
