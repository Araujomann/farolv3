import {
    getTemporalPeriodRange,
    TEMPORAL_PERIOD_OPTIONS,
} from "@/src/features/map/utils/temporalPeriod";

describe("getTemporalPeriodRange", () => {
    it("recua o número de meses mantendo o dia", () => {
        const now = new Date(2026, 10, 16, 10, 0);
        const { from, to } = getTemporalPeriodRange(3, now);

        expect(new Date(from)).toEqual(new Date(2026, 7, 16, 10, 0));
        expect(to).toBe(now.toISOString());
    });

    it("usa o último dia quando o mês de destino é mais curto (31/05 → 28/02)", () => {
        const now = new Date(2026, 4, 31, 8, 0);
        const { from } = getTemporalPeriodRange(3, now);

        expect(new Date(from)).toEqual(new Date(2026, 1, 28, 8, 0));
    });

    it("respeita o 29 de fevereiro em ano bissexto", () => {
        const now = new Date(2028, 4, 31, 8, 0);
        const { from } = getTemporalPeriodRange(3, now);

        expect(new Date(from)).toEqual(new Date(2028, 1, 29, 8, 0));
    });

    it("atravessa a virada do ano", () => {
        const now = new Date(2026, 0, 15, 12, 0);
        const { from } = getTemporalPeriodRange(24, now);

        expect(new Date(from)).toEqual(new Date(2024, 0, 15, 12, 0));
    });

    it("não altera a data recebida", () => {
        const now = new Date(2026, 4, 31, 8, 0);
        const snapshot = now.getTime();
        getTemporalPeriodRange(6, now);

        expect(now.getTime()).toBe(snapshot);
    });

    it("oferece os quatro períodos do filtro em ordem crescente", () => {
        expect(TEMPORAL_PERIOD_OPTIONS.map((option) => option.months)).toEqual([
            3, 6, 12, 24,
        ]);
    });
});
