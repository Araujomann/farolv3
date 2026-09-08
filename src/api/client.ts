import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import * as SecureStore from "expo-secure-store";

export const api = axios.create({
    baseURL: process.env.EXPO_PUBLIC_API_URL,
    timeout: 10000,
    headers: {
        "Content-Type": "application/json",
    },
});

api.interceptors.request.use(
    async (config) => {
        const token = await SecureStore.getItemAsync("token");

        if (token) config.headers.Authorization = `Bearer ${token}`

        return config;
    },
    (error) => Promise.reject(error)
);

// Lógica de Fila para prevenir múltiplas chamadas de refresh simultâneas
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
    (response) => response, 
    async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
        const status = error.response?.status;

        // Verifica se deu 401 (Não Autorizado) e garante que a falha NÃO foi na rota de refresh
        if (status === 401 && originalRequest && !originalRequest._retry && originalRequest.url !== "/auth/refresh") {
            if (isRefreshing) {
                // Se já estiver rolando um refresh, bloqueia a requisição atual na fila
                return new Promise(function (resolve, reject) {
                    failedQueue.push({ resolve, reject });
                })
                .then((token) => {
                    originalRequest.headers.Authorization = `Bearer ${token}`;
                    return api(originalRequest);
                })
                .catch((err) => {
                    return Promise.reject(err);
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                const refreshToken = await SecureStore.getItemAsync("refresh_token");
                if (!refreshToken) {
                    throw new Error("Sem refresh_token disponível");
                }

                // Cria uma requisição limpa para NÃO passar por *este* interceptor
                const refreshResponse = await axios.post(`${process.env.EXPO_PUBLIC_API_URL}/auth/refresh`, {
                    refreshToken: refreshToken
                });

                const { tokens } = refreshResponse.data.data;

                // Salva os novos tokens no banco do dispositivo
                await SecureStore.setItemAsync("token", tokens.accessToken);
                await SecureStore.setItemAsync("refresh_token", tokens.refreshToken);

                // Configura o novo token na requisição repetida
                api.defaults.headers.common["Authorization"] = `Bearer ${tokens.accessToken}`;
                originalRequest.headers.Authorization = `Bearer ${tokens.accessToken}`;

                // Avisa todo mundo da fila que fomos bem sucedidos para eles reconectarem
                processQueue(null, tokens.accessToken);

                // Refaz a requisição original falhada e devolve para quem chamou com sucesso
                return api(originalRequest);
            } catch (refreshError) {
                // Se a própria renovação falhou (tempo longo, banido, etc), rejeita geral e desloga
                processQueue(refreshError, null);
                await SecureStore.deleteItemAsync("token");
                await SecureStore.deleteItemAsync("refresh_token");
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
)
