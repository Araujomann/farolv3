/**
 * Exclusão de conta (LGPD): reautenticação por senha, tratamento de erros
 * da API e limpeza da sessão local. CrashMap API SIMULADA.
 */
import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { Alert } from "react-native";

import DeleteAccountScreen from "@/src/features/settings/components/DeleteAccountScreen";
import { tr } from "@/src/i18n";
import { useAuthStore } from "@/src/store/authStore";
import { makeUser } from "@/test/fixtures";
import { router } from "@/test/mocks/expoRouter";
import { __getStore, __reset } from "@/test/mocks/expoSecureStore";
import { apiError } from "@/test/utils/httpMock";
import { installHttpMock } from "@/test/utils/installHttpMock";

jest.mock("expo-router", () => require("@/test/mocks/expoRouter"));

const http = installHttpMock();

beforeEach(() => {
    useAuthStore.setState({ user: makeUser(), token: "t", isLoading: false });
    __reset({ token: "t", refresh_token: "r", expo_push_token: "ExponentPushToken[x]" });
    jest.spyOn(Alert, "alert").mockImplementation(() => undefined);
});

const typePassword = (value: string) =>
    fireEvent.changeText(
        screen.getByPlaceholderText(tr("deleteAccount.passwordPlaceholder")),
        value,
    );

const confirm = async () => {
    await act(async () => {
        fireEvent.press(screen.getByText(tr("deleteAccount.confirm")));
    });
};

it("explica as consequências antes da exclusão", () => {
    render(<DeleteAccountScreen />);

    expect(screen.getByText(tr("deleteAccount.warningTitle"))).toBeTruthy();
    expect(screen.getByText(tr("deleteAccount.consequenceReports"))).toBeTruthy();
});

it("exige a senha sem chamar a API", async () => {
    render(<DeleteAccountScreen />);

    await confirm();

    expect(screen.getByText(tr("deleteAccount.passwordRequired"))).toBeTruthy();
    expect(http.calls).toHaveLength(0);
});

it("apaga a mensagem de erro ao voltar a digitar", async () => {
    render(<DeleteAccountScreen />);
    await confirm();

    typePassword("s");

    expect(screen.queryByText(tr("deleteAccount.passwordRequired"))).toBeNull();
});

it.each([
    ["INVALID_PASSWORD", "deleteAccount.wrongPassword"],
    ["STAFF_ACCOUNT_DELETION_FORBIDDEN", "deleteAccount.staffBlocked"],
    ["ALGO_INESPERADO", "deleteAccount.genericError"],
] as const)("traduz o erro %s da API", async (code, key) => {
    http.on("DELETE", "/users/me", apiError(403, code));
    render(<DeleteAccountScreen />);

    typePassword("senha-atual");
    await confirm();

    expect(screen.getByText(tr(key))).toBeTruthy();
    expect(useAuthStore.getState().token).toBe("t");
});

it("exclui a conta, limpa a sessão local e volta ao login", async () => {
    http.on("DELETE", "/users/me", { status: 204 });
    render(<DeleteAccountScreen />);

    typePassword("senha-atual");
    await confirm();

    expect(JSON.parse(http.calls[0].data)).toEqual({ password: "senha-atual" });
    expect(__getStore()).toEqual({});
    expect(useAuthStore.getState()).toMatchObject({ user: null, token: null });
    expect(router.replace).toHaveBeenCalledWith("/(auth)/login");
    expect(Alert.alert).toHaveBeenCalledWith(
        tr("deleteAccount.successTitle"),
        tr("deleteAccount.successMessage"),
    );
});

it("'manter minha conta' volta sem excluir", () => {
    render(<DeleteAccountScreen />);

    fireEvent.press(screen.getByText(tr("deleteAccount.keep")));

    expect(router.back).toHaveBeenCalled();
    expect(http.calls).toHaveLength(0);
});
