/**
 * Formulário de relato de acidente: regras de envio, restrição a contas
 * não verificadas e montagem do payload. O serviço de criação de acidente
 * e a geocodificação são SIMULADOS; a data/hora atual é fixada.
 */
import { act, fireEvent, render, screen } from "@testing-library/react-native";

import ReportFormScreen from "@/app/(tabs)/report/form";
import * as accidentService from "@/src/features/map/services/accidentService";
import * as geocoding from "@/src/features/map/services/reverseGeocode";
import { tr } from "@/src/i18n";
import { useAuthStore } from "@/src/store/authStore";
import { makeAccident, makeUser } from "@/test/fixtures";
import { __setParams, navigation, router } from "@/test/mocks/expoRouter";
import { silenceConsole } from "@/test/utils/console";

jest.mock("expo-router", () => require("@/test/mocks/expoRouter"));
jest.mock("@/src/features/map/services/accidentService");
jest.mock("@/src/features/map/services/reverseGeocode");

const createAccident = jest.mocked(accidentService.createAccident);
const NOW = new Date(2026, 10, 16, 18, 0); // 16/11/2026 18:00 (local)

beforeEach(() => {
    jest.useFakeTimers({ now: NOW });
    jest.mocked(geocoding.reverseGeocode).mockResolvedValue("Rua Ceará, Imperatriz");
    createAccident.mockResolvedValue(makeAccident());
    useAuthStore.setState({ user: makeUser(), token: "t", isLoading: false });
    __setParams({ latitude: "-5.52693", longitude: "-47.47812" });
});

afterEach(() => {
    jest.useRealTimers();
});

const renderForm = async () => {
    render(<ReportFormScreen />);
    await screen.findByText("Rua Ceará, Imperatriz");
};

const fillRequired = ({ time = "14:30", type = "COLISÃO" } = {}) => {
    fireEvent.changeText(screen.getByLabelText(tr("report.form.timeLabel")), time);
    fireEvent.press(screen.getByText(type));
    fireEvent.press(screen.getByText(tr("enums.classification.com_vitima")));
    fireEvent.press(screen.getByText(tr("enums.weather.chuva")));
    fireEvent.press(screen.getByText(tr("enums.severity.high")));
};

const submit = async () => {
    await act(async () => {
        fireEvent.press(screen.getByLabelText(tr("report.form.submitLabel")));
    });
};

/** Mensagem de erro exibida acima do botão de envio. */
const expectError = (key: Parameters<typeof tr>[0]) =>
    expect(screen.getByText(tr(key))).toBeTruthy();

it("envia o relato completo e abre a tela de sucesso", async () => {
    await renderForm();
    fillRequired();
    fireEvent.changeText(
        screen.getByLabelText(tr("report.form.description")),
        "  Dois carros no cruzamento  ",
    );

    await submit();

    expect(createAccident).toHaveBeenCalledWith({
        tipo_acidente: "COLISÃO",
        classificacao_acidente: "com_vitima",
        condicao_meteorologica: "chuva",
        description: "Dois carros no cruzamento",
        latitude: -5.52693,
        longitude: -47.47812,
        occurredAt: new Date(2026, 10, 16, 14, 30).toISOString(),
        severity: "high",
    });
    expect(router.replace).toHaveBeenCalledWith("/report/success");
});

it("omite a descrição vazia", async () => {
    await renderForm();
    fillRequired();

    await submit();

    expect(createAccident.mock.calls[0][0].description).toBeUndefined();
});

it("bloqueia o envio de contas com e-mail não verificado", async () => {
    useAuthStore.setState({ user: makeUser({ is_email_verified: false }) });
    await renderForm();
    fillRequired();

    await submit();

    expectError("report.form.verifyRequired");
    expect(createAccident).not.toHaveBeenCalled();
});

it("exige todos os campos obrigatórios", async () => {
    await renderForm();
    fireEvent.changeText(screen.getByLabelText(tr("report.form.timeLabel")), "14:30");
    fireEvent.press(screen.getByText("COLISÃO"));

    await submit();

    expectError("report.form.requiredFields");
    expect(createAccident).not.toHaveBeenCalled();
});

it("exige o tipo livre quando o tipo é 'Outro' e o normaliza", async () => {
    await renderForm();
    fillRequired({ type: "OUTRO" });

    await submit();
    expectError("report.form.customTypeRequired");

    fireEvent.changeText(
        screen.getByPlaceholderText(tr("report.form.customTypePlaceholder")),
        "  queda   de moto ",
    );
    await submit();

    expect(createAccident.mock.calls[0][0].tipo_acidente).toBe("QUEDA DE MOTO");
});

it("recusa horário futuro", async () => {
    await renderForm();
    fillRequired({ time: "18:30" });

    await submit();

    expectError("report.form.futureTime");
    expect(createAccident).not.toHaveBeenCalled();
});

it("recusa horário incompleto ou inexistente", async () => {
    await renderForm();
    fillRequired({ time: "25:00" });

    await submit();

    expectError("report.form.invalidTime");
});

it("recusa o envio sem localização confirmada", async () => {
    __setParams({});
    render(<ReportFormScreen />);
    await screen.findByText(tr("report.form.confirmedLocationUnavailable"));
    fillRequired();

    await submit();

    expectError("report.form.locationUnavailable");
    expect(createAccident).not.toHaveBeenCalled();
});

it("mantém o formulário e informa falha no envio", async () => {
    silenceConsole();
    createAccident.mockRejectedValue(new Error("offline"));
    await renderForm();
    fillRequired();

    await submit();

    expectError("report.form.submitError");
    expect(router.replace).not.toHaveBeenCalled();
    expect(screen.getByLabelText(tr("report.form.timeLabel")).props.value).toBe("14:30");
});

it("pede confirmação antes de abandonar o relato", async () => {
    await renderForm();

    fireEvent.press(screen.getByLabelText(tr("report.form.backToLocation")));
    expect(screen.getByText(tr("report.form.leaveTitle"))).toBeTruthy();

    fireEvent.press(screen.getByLabelText(tr("report.form.leave")));
    expect(navigation.dispatch).toHaveBeenCalledWith({ type: "POP_TO_TOP" });
    expect(navigation.dispatch).toHaveBeenCalledWith({
        type: "JUMP_TO",
        payload: { name: "map" },
    });
});
