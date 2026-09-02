import axios from "axios";
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
)

api.interceptors.response.use(
    (response) => response, 
    async (error) => {
        const status = error.response?.status;
        if(status === 401) {
            await SecureStore.deleteItemAsync("token");
        }
        return Promise.reject(error);
    }
)
