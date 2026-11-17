/**
 * Recuperação de senha em duas telas: pedido do código / confirmação do
 * código e definição da nova senha. CrashMap API SIMULADA.
 */
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react-native";

import ForgotPasswordScreen from "@/app/(auth)/forgot-password";
import ResetPasswordScreen from "@/app/(auth)/reset-password";
import { tr } from "@/src/i18n";
import { useAuthStore } from "@/src/store/authStore";
import { __setParams, router } from "@/test/mocks/expoRouter";
import { __getStore, __reset } from "@/test/mocks/expoSecureStore";
import { apiError } from "@/test/utils/httpMock";
import { installHttpMock } from "@/test/utils/installHttpMock";

jest.mock("expo-router", () => require("@/test/mocks/expoRouter"));

const http = installHttpMock();
const VALID_TOKEN = "a".repeat(64);

describe("Esqueci minha senha", () => {
    const requestCode = async (email = "maria@exemplo.com") => {
        fireEvent.changeText(screen.getByPlaceholderText(tr("auth.emailPlaceholder")), email);
        fireEvent.press(screen.getByText(tr("auth.forgot.submit")));
    };

    it("valida o e-mail antes de enviar", async () => {
        render(<ForgotPasswordScreen />);

        await requestCode("maria");

        expect(await screen.findByText(tr("auth.validation.invalidEmail"))).toBeTruthy();
        expect(http.calls).toHaveLength(0);
    });

    it("envia o código e passa para a etapa do código com espera de 60 s", async () => {
        http.on("POST", "/auth/forgot-password", { status: 200, data: { data: {} } });
        render(<ForgotPasswordScreen />);

        await requestCode();

        expect(await screen.findByText(tr("auth.forgot.codeTitle"))).toBeTruthy();
        expect(JSON.parse(http.calls[0].data)).toEqual({ email: "maria@exemplo.com" });
        expect(screen.getByText(tr("auth.forgot.resendIn", { seconds: 60 }))).toBeTruthy();
    });

    it("informa falha no envio", async () => {
        http.on("POST", "/auth/forgot-password", apiError(500, "INTERNAL"));
        render(<ForgotPasswordScreen />);

        await requestCode();

        expect(await screen.findByText(tr("auth.forgot.sendError"))).toBeTruthy();
        expect(screen.queryByText(tr("auth.forgot.codeTitle"))).toBeNull();
    });

    describe("etapa do código", () => {
        beforeEach(async () => {
            http.on("POST", "/auth/forgot-password", { status: 200, data: { data: {} } });
            render(<ForgotPasswordScreen />);
            await requestCode();
            await screen.findByText(tr("auth.forgot.codeTitle"));
        });

        const submitCode = (code: string) => {
            fireEvent.changeText(screen.getByPlaceholderText("000000"), code);
            fireEvent.press(screen.getByText(tr("auth.confirmCode")));
        };

        it("exige seis dígitos", async () => {
            submitCode("12a45");

            expect(await screen.findByText(tr("auth.codeLength"))).toBeTruthy();
        });

        it("informa código incorreto (400)", async () => {
            http.on("POST", "/auth/verify-password-reset-code", apiError(400, "INVALID_CODE"));

            submitCode("123456");

            expect(await screen.findByText(tr("auth.forgot.invalidCode"))).toBeTruthy();
            expect(router.replace).not.toHaveBeenCalled();
        });

        it("com o código certo, abre a redefinição com a autorização", async () => {
            http.on("POST", "/auth/verify-password-reset-code", {
                status: 200,
                data: { data: { authorizationToken: VALID_TOKEN } },
            });

            submitCode("123456");

            await waitFor(() =>
                expect(router.replace).toHaveBeenCalledWith({
                    pathname: "/(auth)/reset-password",
                    params: { authorizationToken: VALID_TOKEN },
                }),
            );
            expect(JSON.parse(http.calls.at(-1)!.data)).toEqual({
                email: "maria@exemplo.com",
                code: "123456",
            });
        });
    });
});

describe("Redefinir senha", () => {
    const initialAuth = useAuthStore.getState();

    beforeEach(() => {
        useAuthStore.setState(initialAuth, true);
    });

    const submitPasswords = (password: string, confirm = password) => {
        const [passwordField, confirmField] = screen.getAllByPlaceholderText("••••••••");
        fireEvent.changeText(passwordField, password);
        fireEvent.changeText(confirmField, confirm);
        fireEvent.press(screen.getByText(tr("auth.reset.submit")));
    };

    it("recusa autorização ausente ou malformada e oferece pedir outra", () => {
        __setParams({ authorizationToken: "nao-hex" });
        render(<ResetPasswordScreen />);

        expect(screen.getByText(tr("auth.reset.invalidAuthorization"))).toBeTruthy();
        expect(screen.queryByPlaceholderText("••••••••")).toBeNull();

        fireEvent.press(screen.getByText(tr("auth.reset.requestAgain")));
        expect(router.replace).toHaveBeenCalledWith("/(auth)/forgot-password");
    });

    it("exige confirmação igual à nova senha", async () => {
        __setParams({ authorizationToken: VALID_TOKEN });
        render(<ResetPasswordScreen />);

        submitPasswords("nova-senha-1", "nova-senha-2");

        expect(await screen.findByText(tr("auth.validation.passwordsMismatch"))).toBeTruthy();
        expect(http.calls).toHaveLength(0);
    });

    it("salva a nova senha, encerra sessões locais e orienta a entrar de novo", async () => {
        __setParams({ authorizationToken: VALID_TOKEN });
        __reset({ token: "old", refresh_token: "old-refresh" });
        http.on("POST", "/auth/reset-password", { status: 200, data: { data: {} } });
        http.on("POST", "/auth/logout", { status: 204 });
        render(<ResetPasswordScreen />);

        submitPasswords("nova-senha-1");

        expect(await screen.findByText(tr("auth.reset.doneTitle"))).toBeTruthy();
        expect(JSON.parse(http.callsTo("POST", "/auth/reset-password")[0].data)).toEqual({
            authorizationToken: VALID_TOKEN,
            newPassword: "nova-senha-1",
        });
        expect(__getStore()).toEqual({});

        fireEvent.press(screen.getByText(tr("auth.reset.goToLogin")));
        expect(router.replace).toHaveBeenCalledWith("/(auth)/login");
    });

    it("informa falha ao salvar", async () => {
        __setParams({ authorizationToken: VALID_TOKEN });
        http.on("POST", "/auth/reset-password", apiError(400, "EXPIRED"));
        render(<ResetPasswordScreen />);

        submitPasswords("nova-senha-1");

        expect(await screen.findByText(tr("auth.reset.error"))).toBeTruthy();
        await act(async () => {});
    });
});
