/**
 * Serviços de acidentes (mapa, detalhes, comentários, selos e panorama)
 * executando o cliente HTTP real contra a API SIMULADA.
 */
import { countAccidentsByTimeOfDay, getAccidentOverview } from "@/src/api/accidents";
import {
    createAccident,
    createAccidentComment,
    getAccidentDetails,
    getAccidentsForMap,
    getAccidentsMapVersion,
    setAccidentTrust,
} from "@/src/features/map/services/accidentService";
import { makeAccident, makeAccidentDetail, makeOverview } from "@/test/fixtures";
import { apiError } from "@/test/utils/httpMock";
import { installHttpMock } from "@/test/utils/installHttpMock";

const http = installHttpMock();

describe("getAccidentsForMap", () => {
    it("envia só os filtros preenchidos como parâmetros", async () => {
        http.on("GET", "/accidents/map", { status: 200, data: { data: [], total: 0 } });

        await getAccidentsForMap({
            severity: "high",
            classificacao: "com_vitima",
            source: "PRF",
            source_year: 2024,
            from: "2026-08-16T00:00:00.000Z",
            to: "2026-11-16T00:00:00.000Z",
            search: "",
        });

        expect(http.calls[0].params).toEqual({
            severity: "high",
            classificacao: "com_vitima",
            source: "PRF",
            source_year: "2024",
            from: "2026-08-16T00:00:00.000Z",
            to: "2026-11-16T00:00:00.000Z",
        });
    });

    it("sem filtros, não envia parâmetros", async () => {
        http.on("GET", "/accidents/map", { status: 200, data: { data: [], total: 0 } });

        await getAccidentsForMap();

        expect(http.calls[0].params).toEqual({});
    });

    it("corrige textos com codificação quebrada (mojibake) vindos da PRF", async () => {
        http.on("GET", "/accidents/map", {
            status: 200,
            data: {
                data: [
                    makeAccident({ tipo_acidente: "ColisÃ£o traseira" }),
                    makeAccident({ id: "acc-2", tipo_acidente: "Colisão lateral" }),
                ],
                total: 2,
            },
        });

        const accidents = await getAccidentsForMap();

        expect(accidents.map((accident) => accident.tipo_acidente)).toEqual([
            "Colisão traseira",
            "Colisão lateral",
        ]);
    });

    it("mantém o texto original quando a correção não é possível", async () => {
        http.on("GET", "/accidents/map", {
            status: 200,
            data: { data: [makeAccident({ tipo_acidente: "Ã© estranho Ã" })], total: 1 },
        });

        const [accident] = await getAccidentsForMap();

        expect(accident.tipo_acidente).toBe("Ã© estranho Ã");
    });
});

describe("demais serviços do acidente", () => {
    it("codifica o ID na URL dos detalhes e corrige o tipo", async () => {
        http.on("GET", "/accidents/a%2Fb", {
            status: 200,
            data: { data: makeAccidentDetail({ tipo_acidente: "ColisÃ£o frontal" }) },
        });

        const detail = await getAccidentDetails("a/b");

        expect(http.calls[0].url).toBe("/accidents/a%2Fb");
        expect(detail.tipo_acidente).toBe("Colisão frontal");
    });

    it("publica comentário com o texto informado", async () => {
        http.on("POST", "/accidents/acc-1/comments", {
            status: 201,
            data: { data: { id: "c1", body: "Ok" } },
        });

        await expect(createAccidentComment("acc-1", "Ok")).resolves.toEqual({
            id: "c1",
            body: "Ok",
        });
        expect(JSON.parse(http.calls[0].data)).toEqual({ body: "Ok" });
    });

    it("dá o selo com POST e remove com DELETE", async () => {
        const summary = { trusted_count: 1, trusted_by_me: true };
        http.on("POST", "/accidents/acc-1/trust", { status: 200, data: { data: summary } });
        http.on("DELETE", "/accidents/acc-1/trust", {
            status: 200,
            data: { data: { trusted_count: 0, trusted_by_me: false } },
        });

        await expect(setAccidentTrust("acc-1", true)).resolves.toEqual(summary);
        await expect(setAccidentTrust("acc-1", false)).resolves.toMatchObject({
            trusted_by_me: false,
        });
    });

    it("envia o relato no corpo da requisição", async () => {
        http.on("POST", "/accidents/", { status: 201, data: { data: makeAccident() } });
        const input = {
            tipo_acidente: "COLISÃO",
            classificacao_acidente: "sem_vitima" as const,
            condicao_meteorologica: "chuva" as const,
            latitude: -5.5,
            longitude: -47.4,
            occurredAt: "2026-11-16T17:30:00.000Z",
            severity: "low" as const,
        };

        await createAccident(input);

        expect(JSON.parse(http.calls[0].data)).toEqual(input);
    });

    it("lê a versão dos dados do mapa", async () => {
        http.on("GET", "/accidents/map/version", {
            status: 200,
            data: { data: { version: "v42" } },
        });

        await expect(getAccidentsMapVersion()).resolves.toBe("v42");
    });
});

describe("countAccidentsByTimeOfDay", () => {
    it("conta em oito faixas de 3 h no horário de Imperatriz", () => {
        const counts = countAccidentsByTimeOfDay([
            { occurred_at: "2026-11-16T02:59:00.000Z" }, // 23:59 local → 21–24
            { occurred_at: "2026-11-16T03:00:00.000Z" }, // 00:00 local → 0–3
            { occurred_at: "2026-11-16T17:30:00.000Z" }, // 14:30 local → 12–15
        ]);

        expect(counts).toEqual([
            { start_hour: 0, count: 1 },
            { start_hour: 3, count: 0 },
            { start_hour: 6, count: 0 },
            { start_hour: 9, count: 0 },
            { start_hour: 12, count: 1 },
            { start_hour: 15, count: 0 },
            { start_hour: 18, count: 0 },
            { start_hour: 21, count: 1 },
        ]);
    });

    it("recusa listas com data inválida", () => {
        expect(() =>
            countAccidentsByTimeOfDay([{ occurred_at: "não é data" }]),
        ).toThrow("data inválida");
    });
});

describe("getAccidentOverview", () => {
    const now = new Date("2026-11-16T15:00:00.000Z");
    const daysAgo = (days: number) =>
        new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();

    beforeEach(() => {
        jest.useFakeTimers({ now, doNotFake: ["setImmediate", "nextTick"] });
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it("usa o panorama calculado pela API quando disponível", async () => {
        const overview = makeOverview();
        http.on("GET", "/accidents/overview", { status: 200, data: { data: overview } });

        await expect(getAccidentOverview()).resolves.toEqual(overview);
        expect(http.callsTo("GET", "/accidents/map")).toHaveLength(0);
    });

    it("calcula o panorama a partir do mapa quando a API não tem o endpoint (404)", async () => {
        http.on("GET", "/accidents/overview", apiError(404, "NOT_FOUND"));
        http.on("GET", "/accidents/map", {
            status: 200,
            data: {
                data: [
                    makeAccident({
                        id: "1",
                        severity: "critical",
                        classificacao_acidente: "com_vitima",
                        occurred_at: daysAgo(1),
                    }),
                    makeAccident({ id: "2", severity: "low", occurred_at: daysAgo(10) }),
                    makeAccident({ id: "3", severity: "high", occurred_at: daysAgo(45) }),
                    makeAccident({ id: "4", severity: "medium", occurred_at: daysAgo(90) }),
                ],
                total: 4,
            },
        });

        const overview = await getAccidentOverview();

        expect(overview).toMatchObject({
            approved_accidents_count: 4,
            accidents_with_victims_count: 1,
            high_severity_accidents_count: 2,
            current_30_days_count: 2,
            previous_30_days_count: 1,
            severity_distribution: { low: 1, medium: 1, high: 1, critical: 1 },
        });
        // Só os acidentes dos últimos 30 dias entram nas faixas de horário.
        const totalByHour = overview.time_of_day.reduce(
            (sum, period) => sum + period.count,
            0,
        );
        expect(totalByHour).toBe(2);
        expect(overview.recent_accidents.map((accident) => accident.id)).toEqual([
            "1",
            "2",
            "3",
            "4",
        ]);
    });

    it("propaga erros que não sejam 404", async () => {
        http.on("GET", "/accidents/overview", apiError(500, "INTERNAL"));

        await expect(getAccidentOverview()).rejects.toMatchObject({
            response: { status: 500 },
        });
    });

    it("recusa calcular quando o mapa atingiu o limite de registros", async () => {
        http.on("GET", "/accidents/overview", apiError(404, "NOT_FOUND"));
        http.on("GET", "/accidents/map", {
            status: 200,
            data: {
                data: Array.from({ length: 5000 }, (_, index) =>
                    makeAccident({ id: String(index) }),
                ),
                total: 5000,
            },
        });

        await expect(getAccidentOverview()).rejects.toThrow(
            "O panorama completo ainda não está disponível.",
        );
    });

    it("recusa dados com gravidade desconhecida", async () => {
        http.on("GET", "/accidents/overview", apiError(404, "NOT_FOUND"));
        http.on("GET", "/accidents/map", {
            status: 200,
            data: {
                data: [makeAccident({ severity: "extreme" as never })],
                total: 1,
            },
        });

        await expect(getAccidentOverview()).rejects.toThrow(
            "gravidade desconhecida",
        );
    });
});
