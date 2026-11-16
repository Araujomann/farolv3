import type { TranslationKey } from "@/src/i18n";

/** Períodos do filtro temporal do mapa, também usados nas estatísticas da Home. */
export type TemporalPeriod = "quarterly" | "semiannual" | "annual" | "biennial";

export const TEMPORAL_PERIOD_OPTIONS: {
    value: TemporalPeriod;
    label: TranslationKey;
    months: number;
}[] = [
    { value: "quarterly", label: "filters.quarterly", months: 3 },
    { value: "semiannual", label: "filters.semiannual", months: 6 },
    { value: "annual", label: "filters.annual", months: 12 },
    { value: "biennial", label: "filters.biennial", months: 24 },
];

/**
 * Intervalo `from`/`to` (ISO) dos últimos `months` meses até `now`. O dia do
 * mês é mantido; em meses mais curtos vira o último dia (31/05 → 28/02).
 */
export function getTemporalPeriodRange(
    months: number,
    now: Date = new Date(),
): { from: string; to: string } {
    const from = new Date(now);
    const dayOfMonth = from.getDate();
    from.setDate(1);
    from.setMonth(from.getMonth() - months);
    const lastDayOfMonth = new Date(
        from.getFullYear(),
        from.getMonth() + 1,
        0,
    ).getDate();
    from.setDate(Math.min(dayOfMonth, lastDayOfMonth));

    return { from: from.toISOString(), to: now.toISOString() };
}
