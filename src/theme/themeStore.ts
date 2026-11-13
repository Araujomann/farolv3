import * as SecureStore from "expo-secure-store";
import { create } from "zustand";

export type ThemePreference = "system" | "light" | "dark";

const STORAGE_KEY = "theme_preference";

function isThemePreference(value: unknown): value is ThemePreference {
    return value === "system" || value === "light" || value === "dark";
}

type ThemeState = {
    preference: ThemePreference;
    /** `true` depois que a preferência salva foi lida do dispositivo. */
    isHydrated: boolean;
    hydrate: () => Promise<void>;
    setPreference: (preference: ThemePreference) => void;
};

export const useThemeStore = create<ThemeState>((set) => ({
    preference: "system",
    isHydrated: false,

    hydrate: async () => {
        try {
            const stored = await SecureStore.getItemAsync(STORAGE_KEY);
            set({
                preference: isThemePreference(stored) ? stored : "system",
                isHydrated: true,
            });
        } catch {
            set({ isHydrated: true });
        }
    },

    setPreference: (preference) => {
        set({ preference });
        SecureStore.setItemAsync(STORAGE_KEY, preference).catch((error) => {
            if (__DEV__) {
                console.warn("Falha ao salvar a preferência de tema", error);
            }
        });
    },
}));
