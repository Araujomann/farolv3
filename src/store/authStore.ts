import * as SecureStore from "expo-secure-store";
import { create } from "zustand";
import { getMeService } from "../api/auth";
import { AuthActions, AuthState } from "./types";

// Aqui unificamos o State e as Actions
export const useAuthStore = create<AuthState & AuthActions>((set) => ({
    // Estado Inicial
    user: null,
    token: null,
    isLoading: true, // Começa em true enquanto checamos se o usuário já tem login salvo

    // Ação de Login: Salva no SecureStore e atualiza o estado global
    signIn: async (user, token, refreshToken) => {
        await SecureStore.setItemAsync("token", token);
        await SecureStore.setItemAsync("refresh_token", refreshToken);
        set({ user, token, isLoading: false });
    },

    // Ação de Logout: Remove do SecureStore e limpa o estado
    signOut: async () => {
        await SecureStore.deleteItemAsync("token");
        await SecureStore.deleteItemAsync("refresh_token");
        set({ user: null, token: null, isLoading: false });
    },

    // Busca o token salvo ao iniciar o app
    restoreSession: async () => {
        try {
            const token = await SecureStore.getItemAsync("token");

            if (token) {
                // Tenta bater na API do backend (/users/me) usando esse token para pegar os dados recentes do user.
                // Se este token estiver expirado (401), o Interceptor do axios cuidará silenciosamente
                // de bater no /auth/refresh e refazer a chamada.
                const user = await getMeService();
                set({ user, token, isLoading: false });
            } else {
                set({ isLoading: false });
            }
        } catch (error) {
            // Se não conseguir pegar o user (mesmo com refresh, o cara tá deslogado de vez)
            await SecureStore.deleteItemAsync("token");
            await SecureStore.deleteItemAsync("refresh_token");
            set({ user: null, token: null, isLoading: false });
        }
    },
}));
