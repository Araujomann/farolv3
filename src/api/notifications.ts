import { api } from "./client";

export type AdministrativeNotice = {
    id: string;
    message: string;
    created_at: string;
};

type AdministrativeNoticesResponse = {
    data: AdministrativeNotice[];
};

export async function getAdministrativeNotices(): Promise<
    AdministrativeNotice[]
> {
    const response = await api.get<AdministrativeNoticesResponse>(
        "/notifications/administrative-notices",
    );

    return response.data.data;
}