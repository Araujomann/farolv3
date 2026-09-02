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
    token: string;
    user: {
        id: string;
        email: string;
        name: string;
    }
}

export const loginService = (data: LoginPayload) =>
    api.post<AuthResponse>("/auth/login", data); 

export const registerService = (data: RegisterPayload) =>
    api.post<AuthResponse>("/auth/register", data);
    
