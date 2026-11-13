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

type ResendVerificationResponse = {
    data: {
        message: string;
        retryAfterSeconds: number;
    };
}

// Confirma o e-mail do usuário logado com o código de 6 dígitos.
// Retorna o usuário já atualizado (is_email_verified = true).
export const verifyEmailCodeService = async (code: string) => {
    const response = await api.post<GetMeResponse>("/auth/verify-email", { code });
    return response.data.data;
}

// Envia um novo código para o e-mail do usuário logado.
export const resendVerificationCodeService = async () => {
    const response = await api.post<ResendVerificationResponse>("/auth/resend-verification", {});
    return response.data.data;
}
