import {
    validateOverview,
    validatePersonalStats,
} from "@/src/features/home/utils/validateDashboard";
import { makeOverview } from "@/test/fixtures";

describe("validateOverview", () => {
    it("aceita um panorama com contagens inteiras não negativas", () => {
        expect(() => validateOverview(makeOverview())).not.toThrow();
    });

    it("aceita contagens zeradas", () => {
        const overview = makeOverview({
            approved_accidents_count: 0,
            severity_distribution: { low: 0, medium: 0, high: 0, critical: 0 },
        });
        expect(() => validateOverview(overview)).not.toThrow();
    });

    it.each([
        ["negativa", -1],
        ["fracionária", 1.5],
        ["NaN", Number.NaN],
        ["infinita", Number.POSITIVE_INFINITY],
    ])("recusa contagem %s", (_label, value) => {
        expect(() =>
            validateOverview(makeOverview({ approved_accidents_count: value })),
        ).toThrow("A API retornou estatísticas inválidas.");
    });

    it("recusa contagem inválida na distribuição por gravidade", () => {
        const overview = makeOverview({
            severity_distribution: { low: 1, medium: -2, high: 0, critical: 0 },
        });
        expect(() => validateOverview(overview)).toThrow();
    });

    it("recusa contagem inválida em uma faixa de horário", () => {
        const overview = makeOverview();
        overview.time_of_day[3] = { start_hour: 9, count: 2.2 };
        expect(() => validateOverview(overview)).toThrow();
    });

    it("exige exatamente oito faixas de horário", () => {
        const overview = makeOverview();
        overview.time_of_day = overview.time_of_day.slice(0, 7);
        expect(() => validateOverview(overview)).toThrow();
    });
});

describe("validatePersonalStats", () => {
    it("aceita contagens válidas", () => {
        expect(() =>
            validatePersonalStats({
                approved_reports_count: 3,
                received_trust_votes_count: 0,
            }),
        ).not.toThrow();
    });

    it.each([
        [{ approved_reports_count: -1, received_trust_votes_count: 0 }],
        [{ approved_reports_count: 0, received_trust_votes_count: 0.5 }],
        [{ approved_reports_count: Number.NaN, received_trust_votes_count: 1 }],
    ])("recusa estatísticas inválidas %p", (stats) => {
        expect(() => validatePersonalStats(stats)).toThrow(
            "A API retornou estatísticas pessoais inválidas.",
        );
    });
});
