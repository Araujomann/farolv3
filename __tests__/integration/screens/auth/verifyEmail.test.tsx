/**
 * Verificação de e-mail por código de 6 dígitos, com a store de sessão e
 * os serviços reais; CrashMap API SIMULADA. Usa relógio simulado para os
 * temporizadores de reenvio e de entrada no app.
 */
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react-native";

import VerifyEmailScreen from "@/app/(auth)/verify-email";
import { tr } from "@/src/i18n";
import { useAuthStore } from "@/src/store/authStore";
import { makeUser } from "@/test/fixtures";
import { __setParams, router } from "@/test/mocks/expoRouter";
import { apiError } from "@/test/utils/httpMock";
import { installHttpMock } from "@/test/utils/installHttpMock";

jest.mock("expo-router", () => require("@/test/mocks/expoRouter"));

const http = installHttpMock();
const initialAuth = useAuthStore.getState();
const unverified = makeUser({ is_email_verified: false, email_verified_at: null });

beforeEach(() => {
    // A contagem regressiva do reenvio usa setTimeout de 1 s.
    jest.useFakeTimers();
    useAuthStore.setState(
        { ...initialAuth, user: unverified, token: "t", isLoading: false, emailVerificationPrompt: "register" },
        true,
    );
});

afterEach(() => {
    jest.useRealTimers();
});

const submitCode = (code: string) => {
    fireEvent.changeText(screen.getByPlaceholderText("000000"), code);
    fireEvent.press(screen.getByText(tr("auth.confirmCode")));
};

it("não renderiza nada sem usuário logado", () => {
    useAuthStore.setState({ user: null });

    const { toJSON } = render(<VerifyEmailScreen />);

    expect(toJSON()).toBeNull();
});

it("após o cadastro, mostra o e-mail e aguarda 60 s para reenviar", () => {
    render(<VerifyEmailScreen />);

    expect(screen.getByText(tr("auth.verify.title"))).toBeTruthy();
    expect(screen.getByText(unverified.email)).toBeTruthy();
    expect(screen.getByText(tr("auth.verify.resendIn", { seconds: 60 }))).toBeTruthy();
    expect(http.calls).toHaveLength(0);
});

it("confirma o código, atualiza o usuário e entra no app", async () => {
    const verified = makeUser({ is_email_verified: true });
    http.on("POST", "/auth/verify-email", { status: 200, data: { data: verified } });
    render(<VerifyEmailScreen />);

    submitCode("123456");

    expect(await screen.findByText(tr("auth.verify.verifiedTitle"))).toBeTruthy();
    expect(JSON.parse(http.calls[0].data)).toEqual({ code: "123456" });
    expect(useAuthStore.getState().user).toEqual(verified);

    await act(async () => {
        jest.advanceTimersByTime(1800);
    });
    expect(useAuthStore.getState().emailVerificationPrompt).toBeNull();
    expect(router.replace).toHaveBeenCalledWith("/(tabs)/home");
});

it("informa código inválido", async () => {
    http.on("POST", "/auth/verify-email", apiError(400, "AUTH_INVALID_VERIFICATION_CODE"));
    render(<VerifyEmailScreen />);

    submitCode("000000");

    expect(await screen.findByText(tr("auth.verify.invalidCode"))).toBeTruthy();
    expect(useAuthStore.getState().user).toEqual(unverified);
});

it("valida o formato do código antes de chamar a API", async () => {
    render(<VerifyEmailScreen />);

    submitCode("12345");

    expect(await screen.findByText(tr("auth.codeLength"))).toBeTruthy();
    expect(http.calls).toHaveLength(0);
});

it("após o login (send=1), envia um código novo ao abrir", async () => {
    __setParams({ send: "1" });
    http.on("POST", "/auth/resend-verification", {
        status: 200,
        data: { data: { message: "ok", retryAfterSeconds: 60 } },
    });

    render(<VerifyEmailScreen />);

    expect(await screen.findByText(tr("auth.verify.newCodeSent"))).toBeTruthy();
    expect(http.callsTo("POST", "/auth/resend-verification")).toHaveLength(1);
});

it("respeita em silêncio o intervalo de reenvio informado pela API ao abrir", async () => {
    __setParams({ send: "1" });
    http.on(
        "POST",
        "/auth/resend-verification",
        apiError(429, "AUTH_VERIFICATION_CODE_COOLDOWN", "Aguarde 42s para solicitar um novo código."),
    );

    render(<VerifyEmailScreen />);

    expect(
        await screen.findByText(tr("auth.verify.resendIn", { seconds: 42 })),
    ).toBeTruthy();
    expect(screen.queryByText(tr("auth.verify.cooldown", { seconds: 42 }))).toBeNull();
});

it("reconhece conta já verificada em outro aparelho", async () => {
    __setParams({ send: "1" });
    const verified = makeUser({ is_email_verified: true });
    http.on("POST", "/auth/resend-verification", apiError(409, "AUTH_EMAIL_ALREADY_VERIFIED"));
    http.on("GET", "/users/me", { status: 200, data: { data: verified } });

    render(<VerifyEmailScreen />);

    expect(await screen.findByText(tr("auth.verify.verifiedTitle"))).toBeTruthy();
    expect(useAuthStore.getState().user).toEqual(verified);
});

it("'verificar depois' volta para a tela anterior quando aberta pelo app", () => {
    __setParams({ send: "1", from: "app" });
    useAuthStore.setState({ user: makeUser() }); // nada a enviar
    render(<VerifyEmailScreen />);

    fireEvent.press(screen.getByText(tr("auth.verify.continue")));

    expect(router.back).toHaveBeenCalled();
    expect(router.replace).not.toHaveBeenCalled();
});

it("'verificar depois' segue para o app e não reabre a tela", () => {
    render(<VerifyEmailScreen />);

    fireEvent.press(screen.getByText(tr("auth.verify.later")));

    expect(useAuthStore.getState().emailVerificationPrompt).toBeNull();
    expect(router.replace).toHaveBeenCalledWith("/(tabs)/home");
});

it("'usar outra conta' encerra a sessão", async () => {
    http.on("POST", "/auth/logout", { status: 204 });
    render(<VerifyEmailScreen />);

    fireEvent.press(screen.getByText(tr("auth.verify.otherAccount")));

    await waitFor(() => expect(useAuthStore.getState().token).toBeNull());
});
