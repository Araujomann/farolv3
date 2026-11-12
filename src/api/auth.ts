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

export type VerifyPasswordResetCodePayload = {
    email: string;
    code: string;
}

export type ResetPasswordPayload = {
    authorizationToken: string;
    newPassword: string;
}

type PasswordResetAuthorizationResponse = {
    data: {
        authorizationToken: string;
    };
}

export type AuthResponse = {
    data: {
        tokens: {
            accessToken: string;
            refreshToken: string;
        };
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

export const requestPasswordResetService = async (email: string) => {
    const response = await api.post("/auth/forgot-password", { email });
    return response.data.data;
}

export const verifyPasswordResetCodeService = async (
    data: VerifyPasswordResetCodePayload,
) => {
    const response = await api.post<PasswordResetAuthorizationResponse>(
        "/auth/verify-password-reset-code",
        data,
    );
    return response.data.data.authorizationToken;
}

export const resetPasswordService = async (data: ResetPasswordPayload) => {
    const response = await api.post("/auth/reset-password", data);
    return response.data.data;
}

export const getMeService = async () => {
    const response = await api.get<GetMeResponse>("/users/me");
    return response.data.data;
}

// ==========================================
// VERIFICAÇÃO DE EMAIL
// ==========================================

export type VerifyEmailPayload = {
    token: string;
}

type VerifyEmailResponse = {
    data: {
        message: string;
    };
}

export const verifyEmailService = async (token: string) => {
    const response = await api.post<VerifyEmailResponse>("/auth/verify-email", { token });
    return response.data.data.message;
}

export const resendVerificationEmailService = async (email: string) => {
    const response = await api.post("/auth/resend-verification", { email });
    return response.data;
}
