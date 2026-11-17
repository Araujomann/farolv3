import {
    maskOccurrenceTime,
    resolveOccurrenceTime,
} from "@/src/features/report/utils/occurrenceTime";

describe("maskOccurrenceTime", () => {
    it.each([
        ["", ""],
        ["1", "1"],
        ["14", "14"],
        ["143", "14:3"],
        ["1430", "14:30"],
    ])("formata a digitação progressiva %p como %p", (input, expected) => {
        expect(maskOccurrenceTime(input)).toBe(expected);
    });

    it("descarta caracteres que não são dígitos", () => {
        expect(maskOccurrenceTime("1a4:3b0")).toBe("14:30");
    });

    it("limita a quatro dígitos (HH:MM)", () => {
        expect(maskOccurrenceTime("143059")).toBe("14:30");
    });

    it("reformata o valor já mascarado sem duplicar os dois-pontos", () => {
        expect(maskOccurrenceTime("14:30")).toBe("14:30");
    });
});

describe("resolveOccurrenceTime", () => {
    // Dia do relato e "agora" fixos: 16/11/2026 às 18:00 no fuso do aparelho.
    const reportDate = new Date(2026, 10, 16, 9, 0);
    const now = new Date(2026, 10, 16, 18, 0);

    it("monta a data no dia do relato com o horário informado", () => {
        const result = resolveOccurrenceTime("14:30", reportDate, now);

        expect(result).toEqual({
            ok: true,
            occurredAt: new Date(2026, 10, 16, 14, 30),
        });
    });

    it("aceita os limites do dia (00:00)", () => {
        const result = resolveOccurrenceTime("00:00", reportDate, now);
        expect(result.ok).toBe(true);
    });

    it("aceita exatamente o instante atual", () => {
        expect(resolveOccurrenceTime("18:00", reportDate, now).ok).toBe(true);
    });

    it("recusa horário posterior ao momento atual", () => {
        expect(resolveOccurrenceTime("18:01", reportDate, now)).toEqual({
            ok: false,
            reason: "future",
        });
    });

    it.each(["24:00", "12:60", "9:30", "0930", "", "ab:cd", "14:3"])(
        "recusa o horário inválido %p",
        (time) => {
            expect(resolveOccurrenceTime(time, reportDate, now)).toEqual({
                ok: false,
                reason: "invalid",
            });
        },
    );

    it("usa o dia do relato e não o dia atual", () => {
        // Relato aberto às 23:50 do dia 15 e enviado já no dia 16.
        const openedYesterday = new Date(2026, 10, 15, 23, 50);
        const result = resolveOccurrenceTime("23:40", openedYesterday, now);

        expect(result).toEqual({
            ok: true,
            occurredAt: new Date(2026, 10, 15, 23, 40),
        });
    });
});
