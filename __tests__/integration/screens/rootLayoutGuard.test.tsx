/**
 * Guarda de navegação do layout raiz (app/_layout.tsx): decide para onde o
 * usuário vai conforme a sessão, o aceite dos termos (LGPD) e a verificação
 * do e-mail. A navegação, o mapa, a splash, as fontes e o registro de push
 * são SIMULADOS; a regra de redirecionamento é a do código real.
 */
import { render, waitFor } from "@testing-library/react-native";

import RootLayout from "@/app/_layout";
import * as push from "@/src/features/notifications/pushNotifications";
import { useLanguageStore } from "@/src/i18n";
import { useAuthStore } from "@/src/store/authStore";
import type { User } from "@/src/store/types";
import { useThemeStore } from "@/src/theme/themeStore";
import { makeUser } from "@/test/fixtures";
import { __setRootNavigationKey, __setSegments, router } from "@/test/mocks/expoRouter";

jest.mock("expo-router", () => require("@/test/mocks/expoRouter"));
jest.mock("@rnmapbox/maps", () => ({
    __esModule: true,
    default: { setAccessToken: jest.fn() },
}));
jest.mock("expo-splash-screen", () => ({
    preventAutoHideAsync: jest.fn(async () => undefined),
    setOptions: jest.fn(),
    hide: jest.fn(),
}));
jest.mock("expo-font", () => ({ useFonts: jest.fn(() => [true, null]) }));
jest.mock("@expo-google-fonts/inter", () => ({}));
jest.mock("@expo-google-fonts/plus-jakarta-sans", () => ({}));
jest.mock("@/src/features/notifications/pushNotifications", () => ({
    ...jest.requireActual("@/src/features/notifications/pushNotifications"),
    registerForPushNotifications: jest.fn(async () => undefined),
}));

type Session = {
    token?: string | null;
    user?: User | null;
    isLoading?: boolean;
    emailVerificationPrompt?: "login" | "register" | null;
};

const renderAt = (segments: string[], session: Session = {}) => {
    useAuthStore.setState({
        token: null,
        user: null,
        isLoading: false,
        emailVerificationPrompt: null,
        restoreSession: jest.fn(async () => undefined),
        ...session,
    });
    __setSegments(segments);
    return render(<RootLayout />);
};

const signedIn = (user: User = makeUser()): Session => ({ token: "t", user });

beforeEach(() => {
    useThemeStore.setState({ isHydrated: true, hydrate: jest.fn(async () => undefined) });
    useLanguageStore.setState({ isHydrated: true, hydrate: jest.fn(async () => undefined) });
});

const expectNoRedirect = async () => {
    // Deixa os efeitos rodarem antes de afirmar que nada aconteceu.
    await waitFor(() => expect(useAuthStore.getState().restoreSession).toHaveBeenCalled());
    expect(router.replace).not.toHaveBeenCalled();
};

it("restaura a sessão ao abrir o app", async () => {
    renderAt(["(auth)", "login"]);

    await waitFor(() => expect(useAuthStore.getState().restoreSession).toHaveBeenCalledTimes(1));
});

it("não redireciona enquanto a sessão ainda está sendo restaurada", async () => {
    renderAt(["(tabs)", "home"], { isLoading: true });

    await expectNoRedirect();
});

it("não redireciona antes de a navegação estar pronta", async () => {
    __setRootNavigationKey(undefined);
    renderAt(["(tabs)", "home"]);

    await expectNoRedirect();
});

describe("sem sessão", () => {
    it("manda a área logada para o login", async () => {
        renderAt(["(tabs)", "map"]);

        await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/(auth)/login"));
    });

    it.each([
        [["(auth)", "login"]],
        [["(auth)", "register"]],
        [["(auth)", "forgot-password"]],
        [["legal", "terms"]],
        [["legal", "privacy"]],
    ])("deixa abrir %p", async (segments) => {
        renderAt(segments);

        await expectNoRedirect();
    });

    it.each([[["(auth)", "verify-email"]], [["legal", "accept"]]])(
        "exige sessão em %p",
        async (segments) => {
            renderAt(segments);

            await waitFor(() =>
                expect(router.replace).toHaveBeenCalledWith("/(auth)/login"),
            );
        },
    );
});

describe("com sessão", () => {
    it("leva quem está fora da área logada para a Home", async () => {
        renderAt(["(auth)", "login"], signedIn());

        await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/(tabs)/home"));
    });

    it("não interfere na navegação dentro da área logada", async () => {
        renderAt(["(tabs)", "profile"], signedIn());

        await expectNoRedirect();
    });

    it("após aceitar os termos, sai da tela de aceite para a Home", async () => {
        renderAt(["legal", "accept"], signedIn());

        await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/(tabs)/home"));
    });

    it("permite ler os termos sem ser redirecionado", async () => {
        renderAt(["legal", "terms"], signedIn());

        await expectNoRedirect();
    });

    it("registra o aparelho para notificações push", async () => {
        renderAt(["(tabs)", "home"], signedIn());

        await waitFor(() => expect(push.registerForPushNotifications).toHaveBeenCalled());
    });
});

describe("termos de uso desatualizados (LGPD)", () => {
    const pending = signedIn(makeUser({ terms_version: "2025-01-01" }));

    it("exige o aceite da versão atual antes de usar o app", async () => {
        renderAt(["(tabs)", "home"], pending);

        await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/legal/accept"));
    });

    it.each([
        [["(auth)", "reset-password"]],
        [["(auth)", "verify-email"]],
        [["legal", "privacy"]],
    ])("não interrompe %p", async (segments) => {
        renderAt(segments, pending);

        await expectNoRedirect();
    });
});

describe("e-mail não verificado", () => {
    const unverified = makeUser({ is_email_verified: false });

    it("após o login, abre a verificação pedindo um novo código", async () => {
        renderAt(["(auth)", "login"], {
            ...signedIn(unverified),
            emailVerificationPrompt: "login",
        });

        await waitFor(() =>
            expect(router.replace).toHaveBeenCalledWith({
                pathname: "/(auth)/verify-email",
                params: { send: "1" },
            }),
        );
    });

    it("após o cadastro, abre a verificação sem reenviar (o código já foi enviado)", async () => {
        renderAt(["(auth)", "register"], {
            ...signedIn(unverified),
            emailVerificationPrompt: "register",
        });

        await waitFor(() =>
            expect(router.replace).toHaveBeenCalledWith({
                pathname: "/(auth)/verify-email",
                params: {},
            }),
        );
    });

    it("com 'verificar depois' ou sessão restaurada, entra no app mesmo assim", async () => {
        renderAt(["(auth)", "login"], signedIn(unverified));

        await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/(tabs)/home"));
    });
});
