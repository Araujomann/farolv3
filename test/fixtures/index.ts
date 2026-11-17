/**
 * Fábricas de dados de teste. Os formatos seguem os tipos usados pelo app
 * (respostas da CrashMap API); cada teste sobrescreve só o que importa.
 */
import type { AccidentOverview } from "@/src/api/accidents";
import type { MyReport } from "@/src/api/reports";
import type {
    Accident,
    AccidentComment,
    AccidentDetail,
} from "@/src/features/map/types/accident.types";
import { TERMS_VERSION } from "@/src/features/legal/legalConfig";
import type { User } from "@/src/store/types";

export function makeUser(overrides: Partial<User> = {}): User {
    return {
        id: "user-1",
        name: "Maria Silva",
        email: "maria@exemplo.com",
        role: "user",
        is_email_verified: true,
        email_verified_at: "2026-11-01T12:00:00.000Z",
        terms_version: TERMS_VERSION,
        terms_accepted_at: "2026-11-15T12:00:00.000Z",
        created_at: "2026-10-01T12:00:00.000Z",
        updated_at: "2026-11-01T12:00:00.000Z",
        ...overrides,
    };
}

export function makeAccident(overrides: Partial<Accident> = {}): Accident {
    return {
        id: "acc-1",
        tipo_acidente: "COLISÃO",
        classificacao_acidente: "sem_vitima",
        condicao_meteorologica: "ceu_claro",
        latitude: -5.52693,
        longitude: -47.47812,
        occurred_at: "2026-11-10T15:30:00.000Z",
        severity: "medium",
        source: "APP",
        ...overrides,
    };
}

export function makeComment(
    overrides: Partial<AccidentComment> = {},
): AccidentComment {
    return {
        id: "comment-1",
        accident_id: "acc-1",
        created_by_id: "user-2",
        author_name: "João",
        body: "Trânsito lento no local.",
        created_at: "2026-11-10T16:00:00.000Z",
        updated_at: "2026-11-10T16:00:00.000Z",
        ...overrides,
    };
}

export function makeAccidentDetail(
    overrides: Partial<AccidentDetail> = {},
): AccidentDetail {
    return {
        ...makeAccident(),
        description: "Colisão entre dois carros no cruzamento.",
        created_by_id: "user-2",
        created_at: "2026-11-10T15:40:00.000Z",
        moderation_status: "APPROVED",
        trusted_count: 0,
        comments: [],
        images: [],
        ...overrides,
    };
}

export function makeReport(overrides: Partial<MyReport> = {}): MyReport {
    return {
        id: "report-1",
        tipo_acidente: "ATROPELAMENTO",
        description: null,
        latitude: -5.52693,
        longitude: -47.47812,
        occurred_at: "2026-11-10T15:30:00.000Z",
        moderation_status: "APPROVED",
        moderation_message: null,
        images: [],
        ...overrides,
    };
}

export function makeOverview(
    overrides: Partial<AccidentOverview> = {},
): AccidentOverview {
    return {
        approved_accidents_count: 12,
        accidents_with_victims_count: 4,
        high_severity_accidents_count: 3,
        current_30_days_count: 5,
        previous_30_days_count: 2,
        severity_distribution: { low: 3, medium: 6, high: 2, critical: 1 },
        time_of_day: [0, 1, 0, 2, 3, 4, 1, 1].map((count, index) => ({
            start_hour: index * 3,
            count,
        })),
        recent_accidents: [],
        ...overrides,
    };
}

export const TOKENS = {
    accessToken: "access-token-1",
    refreshToken: "refresh-token-1",
};
