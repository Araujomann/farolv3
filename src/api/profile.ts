import type { User } from "../store/types";
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

type MeResponse = {
    data: User;
};

/** Corrige o nome da conta (direito de correção, LGPD art. 18, III). */
export const updateMyName = async (name: string): Promise<User> => {
    const response = await api.patch<MeResponse>("/users/me", { name });

    return response.data.data;
};

/** Registra o aceite de uma versão dos Termos de Uso e da Política de Privacidade. */
export const acceptTerms = async (version: string): Promise<User> => {
    const response = await api.post<MeResponse>("/users/me/terms-acceptance", {
        version,
    });

    return response.data.data;
};

/** Cópia dos dados pessoais da conta (LGPD art. 18, II e V). */
export const exportMyData = async (): Promise<unknown> => {
    const response = await api.get<{ data: unknown }>("/users/me/data-export");

    return response.data.data;
};
