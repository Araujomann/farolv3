import { User } from "../store/types";
import { api } from "./client";

export type LoginPayload = {
    email: string;
    password: string;
}

export type RegisterPayload = {
    email: string;
    name: string;
    password: string;
}

export type AuthResponse = {
    data: {
        token: string;
        refresh_token: string;
        user: User;
    }
}

export type GetMeResponse = {
    data: User;
}

// Já tratamos para devolver .data.data e facilitar a UI
export const loginService = async (data: LoginPayload) => {
    const response = await api.post<AuthResponse>("/auth/login", data); 
    return response.data.data;
}

export const registerService = async (data: RegisterPayload) => {
    const response = await api.post<AuthResponse>("/auth/register", data);
    return response.data.data;
}

export const getMeService = async () => {
    const response = await api.get<GetMeResponse>("/users/me");
    return response.data.data;
}

