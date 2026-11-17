import * as SecureStore from "expo-secure-store";

import { useLanguageStore } from "@/src/i18n";
import { useThemeStore } from "@/src/theme/themeStore";
import { __getStore, __reset } from "@/test/mocks/expoSecureStore";
import { silenceConsole } from "@/test/utils/console";

describe("preferência de tema", () => {
    beforeEach(() => {
        useThemeStore.setState({ preference: "system", isHydrated: false });
    });

    it("restaura a preferência salva no aparelho", async () => {
        __reset({ theme_preference: "dark" });

        await useThemeStore.getState().hydrate();

        expect(useThemeStore.getState()).toMatchObject({
            preference: "dark",
            isHydrated: true,
        });
    });

    it("ignora valor salvo desconhecido e volta ao padrão do sistema", async () => {
        __reset({ theme_preference: "sepia" });

        await useThemeStore.getState().hydrate();

        expect(useThemeStore.getState().preference).toBe("system");
    });

    it("conclui a hidratação mesmo se o armazenamento falhar", async () => {
        jest.mocked(SecureStore.getItemAsync).mockRejectedValueOnce(
            new Error("keystore indisponível"),
        );

        await useThemeStore.getState().hydrate();

        expect(useThemeStore.getState()).toMatchObject({
            preference: "system",
            isHydrated: true,
        });
    });

    it("aplica e persiste a nova preferência", async () => {
        useThemeStore.getState().setPreference("light");

        expect(useThemeStore.getState().preference).toBe("light");
        await Promise.resolve();
        expect(__getStore()).toEqual({ theme_preference: "light" });
    });

    it("mantém a preferência na sessão mesmo se a gravação falhar", async () => {
        const warn = silenceConsole();
        jest.mocked(SecureStore.setItemAsync).mockRejectedValueOnce(
            new Error("falha"),
        );

        useThemeStore.getState().setPreference("dark");
        await new Promise((resolve) => setImmediate(resolve));

        expect(useThemeStore.getState().preference).toBe("dark");
        expect(warn).toHaveBeenCalled();
    });
});

describe("preferência de idioma", () => {
    it("restaura um idioma suportado", async () => {
        __reset({ language_preference: "es" });

        await useLanguageStore.getState().hydrate();

        expect(useLanguageStore.getState().preference).toBe("es");
    });

    it("ignora idioma não suportado", async () => {
        __reset({ language_preference: "fr" });

        await useLanguageStore.getState().hydrate();

        expect(useLanguageStore.getState().preference).toBe("system");
    });

    it("persiste a escolha do usuário", async () => {
        useLanguageStore.getState().setPreference("en");
        await Promise.resolve();

        expect(__getStore()).toEqual({ language_preference: "en" });
    });
});
