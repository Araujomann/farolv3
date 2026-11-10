import { api } from "./client";

export type GamificationStats = {
    approved_reports_count: number;
};

type GamificationStatsResponse = {
    data: GamificationStats;
};

export const getMyGamificationStats = async (): Promise<GamificationStats> => {
    const response = await api.get<GamificationStatsResponse>(
        "/users/me/gamification",
    );

    return response.data.data;
};
