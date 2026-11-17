/**
 * Tela de login integrada ao serviço de autenticação, à store de sessão e
 * ao cliente HTTP reais; a CrashMap API é SIMULADA no adaptador HTTP.
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";

import LoginScreen from "@/app/(auth)/login";
import { tr } from "@/src/i18n";
import { useAuthStore } from "@/src/store/authStore";
import { makeUser, TOKENS } from "@/test/fixtures";
import { router } from "@/test/mocks/expoRouter";
import { __getStore } from "@/test/mocks/expoSecureStore";
import { apiError } from "@/test/utils/httpMock";
import { installHttpMock } from "@/test/utils/installHttpMock";

jest.mock("expo-router", () => require("@/test/mocks/expoRouter"));

const http = installHttpMock();
const initialAuth = useAuthStore.getState();

beforeEach(() => {
    useAuthStore.setState(initialAuth, true);
});

const fillAndSubmit = (email: string, password: string) => {
    fireEvent.changeText(screen.getByPlaceholderText(tr("auth.emailPlaceholder")), email);
    fireEvent.changeText(screen.getByPlaceholderText("••••••••"), password);
    fireEvent.press(screen.getByText(tr("auth.login.submit")));
};

it("valida e-mail e tamanho mínimo da senha sem chamar a API", async () => {
    render(<LoginScreen />);

    fillAndSubmit("maria@", "1234567");

    expect(await screen.findByText(tr("auth.validation.invalidEmail"))).toBeTruthy();
    expect(screen.getByText(tr("auth.validation.passwordMin"))).toBeTruthy();
    expect(http.calls).toHaveLength(0);
});

it("entra com credenciais válidas e inicia a sessão", async () => {
    const user = makeUser();
    http.on("POST", "/auth/login", {
        status: 200,
        data: { data: { tokens: TOKENS, user } },
    });
    render(<LoginScreen />);

    fillAndSubmit("maria@exemplo.com", "senha-segura");

    await waitFor(() => expect(useAuthStore.getState().token).toBe(TOKENS.accessToken));
    expect(JSON.parse(http.calls[0].data)).toEqual({
        email: "maria@exemplo.com",
        password: "senha-segura",
    });
    expect(useAuthStore.getState().user).toEqual(user);
    expect(__getStore()).toEqual({
        token: TOKENS.accessToken,
        refresh_token: TOKENS.refreshToken,
    });
});

it("pede a verificação de e-mail quando a conta não foi verificada", async () => {
    http.on("POST", "/auth/login", {
        status: 200,
        data: { data: { tokens: TOKENS, user: makeUser({ is_email_verified: false }) } },
    });
    render(<LoginScreen />);

    fillAndSubmit("maria@exemplo.com", "senha-segura");

    await waitFor(() =>
        expect(useAuthStore.getState().emailVerificationPrompt).toBe("login"),
    );
});

it("informa credenciais inválidas e não salva sessão", async () => {
    http.on("POST", "/auth/login", apiError(401, "AUTH_INVALID_CREDENTIALS"));
    render(<LoginScreen />);

    fillAndSubmit("maria@exemplo.com", "senha-errada");

    expect(await screen.findByText(tr("auth.login.invalidCredentials"))).toBeTruthy();
    expect(useAuthStore.getState().token).toBeNull();
    expect(__getStore()).toEqual({});
});

it("leva à recuperação de senha e ao cadastro", () => {
    render(<LoginScreen />);

    fireEvent.press(screen.getByText(tr("auth.login.forgotPassword")));
    fireEvent.press(screen.getByText(tr("auth.login.signUp")));

    expect(router.push).toHaveBeenNthCalledWith(1, "/(auth)/forgot-password");
    expect(router.push).toHaveBeenNthCalledWith(2, "/(auth)/register");
});
