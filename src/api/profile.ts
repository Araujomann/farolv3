import { api } from "./client";

export type GamificationStats = {
    approved_reports_count: number;
    received_trust_votes_count: number;
};

type GamificationStatsResponse = {
    data: GamificationStats;
};

/**
 * Exclui permanentemente a conta do usuário corrente.
 * `password` é obrigatório para contas com senha (reautenticação).
 */
export const deleteMyAccount = async (password?: string): Promise<void> => {
    await api.delete("/users/me", { data: password ? { password } : {} });
};

export const getMyGamificationStats = async (): Promise<GamificationStats> => {
    const response = await api.get<GamificationStatsResponse>(
        "/users/me/gamification",
    );

    return response.data.data;
};
