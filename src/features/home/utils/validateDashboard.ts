import type { AccidentOverview } from "@/src/api/accidents";
import type { GamificationStats } from "@/src/api/profile";

/** Lança erro se o panorama de acidentes vier com contagens inválidas. */
export function validateOverview(overview: AccidentOverview) {
    const counts = [
        overview.approved_accidents_count,
        overview.accidents_with_victims_count,
        overview.high_severity_accidents_count,
        overview.current_30_days_count,
        overview.previous_30_days_count,
        ...Object.values(overview.severity_distribution),
        ...overview.time_of_day.map((period) => period.count),
    ];

    if (
        counts.some(
            (count) => !Number.isSafeInteger(count) || count < 0,
        ) ||
        overview.time_of_day.length !== 8
    ) {
        throw new Error("A API retornou estatísticas inválidas.");
    }
}

/** Lança erro se as estatísticas pessoais vierem com contagens inválidas. */
export function validatePersonalStats(stats: GamificationStats) {
    if (
        !Number.isSafeInteger(stats.approved_reports_count) ||
        stats.approved_reports_count < 0 ||
        !Number.isSafeInteger(stats.received_trust_votes_count) ||
        stats.received_trust_votes_count < 0
    ) {
        throw new Error("A API retornou estatísticas pessoais inválidas.");
    }
}
