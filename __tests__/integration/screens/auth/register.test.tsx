/**
 * Cadastro com validação (Zod + React Hook Form), aceite dos termos e
 * início da sessão; a CrashMap API é SIMULADA no adaptador HTTP.
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";

import RegisterScreen from "@/app/(auth)/register";
import { TERMS_VERSION } from "@/src/features/legal/legalConfig";
import { tr } from "@/src/i18n";
import { useAuthStore } from "@/src/store/authStore";
import { makeUser, TOKENS } from "@/test/fixtures";
import { router } from "@/test/mocks/expoRouter";
import { apiError } from "@/test/utils/httpMock";
import { installHttpMock } from "@/test/utils/installHttpMock";

jest.mock("expo-router", () => require("@/test/mocks/expoRouter"));

const http = installHttpMock();
const initialAuth = useAuthStore.getState();

beforeEach(() => {
    useAuthStore.setState(initialAuth, true);
});

type Form = {
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    acceptTerms?: boolean;
};

const fill = ({
    name = "Maria Silva",
    email = "maria@exemplo.com",
    password = "senha-segura",
    confirmPassword = password,
    acceptTerms = true,
}: Form = {}) => {
    fireEvent.changeText(
        screen.getByPlaceholderText(tr("auth.register.namePlaceholder")),
        name,
    );
    fireEvent.changeText(screen.getByPlaceholderText(tr("auth.emailPlaceholder")), email);
    const [passwordField, confirmField] = screen.getAllByPlaceholderText("••••••••");
    fireEvent.changeText(passwordField, password);
    fireEvent.changeText(confirmField, confirmPassword);
    if (acceptTerms) fireEvent.press(screen.getByRole("checkbox"));
    fireEvent.press(screen.getByText(tr("auth.register.submit")));
};

it("exige nome, e-mail válido, senha de 8 caracteres e o aceite dos termos", async () => {
    render(<RegisterScreen />);

    fill({ name: " M ", email: "x", password: "123", confirmPassword: "", acceptTerms: false });

    expect(await screen.findByText(tr("auth.validation.nameMin"))).toBeTruthy();
    expect(screen.getByText(tr("auth.validation.invalidEmail"))).toBeTruthy();
    expect(screen.getByText(tr("auth.validation.passwordMin"))).toBeTruthy();
    expect(screen.getByText(tr("auth.validation.confirmPassword"))).toBeTruthy();
    expect(screen.getByText(tr("auth.validation.acceptTerms"))).toBeTruthy();
    expect(http.calls).toHaveLength(0);
});

it("recusa confirmação de senha diferente", async () => {
    render(<RegisterScreen />);

    fill({ confirmPassword: "outra-senha" });

    expect(await screen.findByText(tr("auth.validation.passwordsMismatch"))).toBeTruthy();
    expect(http.calls).toHaveLength(0);
});

it("cadastra com o nome sem espaços extras e a versão atual dos termos", async () => {
    const user = makeUser({ is_email_verified: false });
    http.on("POST", "/auth/register", {
        status: 201,
        data: { data: { tokens: TOKENS, user } },
    });
    render(<RegisterScreen />);

    fill({ name: "  Maria Silva  " });

    await waitFor(() => expect(useAuthStore.getState().token).toBe(TOKENS.accessToken));
    expect(JSON.parse(http.calls[0].data)).toEqual({
        name: "Maria Silva",
        email: "maria@exemplo.com",
        password: "senha-segura",
        acceptedTermsVersion: TERMS_VERSION,
    });
    // O código foi enviado no cadastro: o layout abre a tela de verificação.
    expect(useAuthStore.getState().emailVerificationPrompt).toBe("register");
});

it("informa e-mail já cadastrado", async () => {
    http.on("POST", "/auth/register", apiError(409, "AUTH_EMAIL_ALREADY_IN_USE"));
    render(<RegisterScreen />);

    fill();

    expect(await screen.findByText(tr("auth.register.emailInUse"))).toBeTruthy();
    expect(useAuthStore.getState().token).toBeNull();
});

it("mostra erro genérico para outras falhas", async () => {
    http.on("POST", "/auth/register", apiError(500, "INTERNAL"));
    render(<RegisterScreen />);

    fill();

    expect(await screen.findByText(tr("auth.register.genericError"))).toBeTruthy();
});

it("abre os termos sem marcar a caixa de aceite", () => {
    render(<RegisterScreen />);

    fireEvent.press(screen.getByText(tr("auth.register.terms")));

    expect(router.push).toHaveBeenCalledWith("/legal/terms");
    expect(screen.getByRole("checkbox")).not.toBeChecked();
});
