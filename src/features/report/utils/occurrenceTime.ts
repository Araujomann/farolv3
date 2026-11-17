const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

/**
 * Máscara do campo de horário: mantém só dígitos (no máximo 4) e insere os
 * dois-pontos depois da hora, formando "HH:MM" enquanto o usuário digita.
 */
export function maskOccurrenceTime(text: string): string {
    const digits = text.replace(/\D/g, "").slice(0, 4);
    return digits.length > 2 ? `${digits.slice(0, 2)}:${digits.slice(2)}` : digits;
}

export type OccurrenceTimeResult =
    | { ok: true; occurredAt: Date }
    | { ok: false; reason: "invalid" | "future" };

/**
 * Monta o instante do acidente a partir do horário digitado (24h, "HH:MM")
 * no dia de `reportDate`, no fuso do aparelho. Um horário posterior a `now`
 * é recusado: o relato não pode ser de um acidente que ainda não aconteceu.
 */
export function resolveOccurrenceTime(
    time: string,
    reportDate: Date,
    now: Date = new Date(),
): OccurrenceTimeResult {
    const match = TIME_PATTERN.exec(time);
    if (!match) return { ok: false, reason: "invalid" };

    const occurredAt = new Date(
        reportDate.getFullYear(),
        reportDate.getMonth(),
        reportDate.getDate(),
        Number(match[1]),
        Number(match[2]),
    );

    if (occurredAt.getTime() > now.getTime()) {
        return { ok: false, reason: "future" };
    }

    return { ok: true, occurredAt };
}
