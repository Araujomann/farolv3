import { api } from "./client";

export type ReportStatus = "APPROVED" | "PENDING" | "REJECTED";

export type MyReport = {
    id: string;
    tipo_acidente: string;
    description: string | null;
    latitude: number;
    longitude: number;
    occurred_at: string;
    moderation_status: ReportStatus;
    moderation_message: string | null;
    images: {
        id: string;
        image_url: string;
        caption: string | null;
    }[];
};

export type MyReportsResponse = {
    data: MyReport[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
};

export const getMyReports = async (params: {
    page: number;
    limit: number;
    status: ReportStatus;
}): Promise<MyReportsResponse> => {
    const response = await api.get<MyReportsResponse>("/users/me/reports", {
        params,
    });

    return response.data;
};
