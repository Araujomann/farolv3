/**
 * Tela "Meus relatos": abas por status de moderação (aprovados, pendentes
 * e rejeitados), estados de carregamento, vazio e erro, e paginação.
 * API de relatos e geocodificação SIMULADAS.
 */
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react-native";

import MyReportsScreen from "@/app/(tabs)/profile/reports";
import * as reportsApi from "@/src/api/reports";
import * as geocoding from "@/src/features/map/services/reverseGeocode";
import { tr } from "@/src/i18n";
import { makeReport } from "@/test/fixtures";
import { router } from "@/test/mocks/expoRouter";
import { silenceConsole } from "@/test/utils/console";

jest.mock("expo-router", () => require("@/test/mocks/expoRouter"));
jest.mock("@/src/api/reports");
jest.mock("@/src/features/map/services/reverseGeocode");

const getMyReports = jest.mocked(reportsApi.getMyReports);

const page = (
    reports: ReturnType<typeof makeReport>[],
    current = 1,
    totalPages = 1,
) => ({
    data: reports,
    pagination: { page: current, limit: 20, total: reports.length, totalPages },
});

beforeEach(() => {
    jest.mocked(geocoding.reverseGeocode).mockResolvedValue("Rua A");
});

it("abre nos aprovados e lista os relatos", async () => {
    getMyReports.mockResolvedValue(page([makeReport({ tipo_acidente: "COLISÃO TRASEIRA" })]));

    render(<MyReportsScreen />);

    expect(screen.getByText(tr("reports.loading"))).toBeTruthy();
    expect(await screen.findByText("COLISÃO TRASEIRA")).toBeTruthy();
    expect(getMyReports).toHaveBeenCalledWith({ status: "APPROVED", page: 1, limit: 20 });
    expect(screen.getByRole("tab", { name: tr("reports.approved") })).toBeSelected();
});

it("troca para os pendentes e mostra o estado vazio", async () => {
    getMyReports
        .mockResolvedValueOnce(page([makeReport()]))
        .mockResolvedValueOnce(page([]));
    render(<MyReportsScreen />);
    await screen.findByText("ATROPELAMENTO");

    fireEvent.press(screen.getByRole("tab", { name: tr("reports.pending") }));

    expect(
        await screen.findByText(
            tr("reports.emptyTitle", { status: tr("reports.pending").toLowerCase() }),
        ),
    ).toBeTruthy();
    expect(getMyReports).toHaveBeenLastCalledWith({ status: "PENDING", page: 1, limit: 20 });
});

it("mostra o motivo nos relatos rejeitados", async () => {
    getMyReports
        .mockResolvedValueOnce(page([]))
        .mockResolvedValueOnce(
            page([
                makeReport({
                    moderation_status: "REJECTED",
                    moderation_message: "Fotos não mostram o acidente",
                }),
            ]),
        );
    render(<MyReportsScreen />);
    await screen.findByText(tr("reports.emptyMessage"));

    fireEvent.press(screen.getByRole("tab", { name: tr("reports.rejected") }));

    expect(await screen.findByText("Fotos não mostram o acidente")).toBeTruthy();
});

it("permite tentar de novo após erro", async () => {
    silenceConsole();
    getMyReports
        .mockRejectedValueOnce(new Error("offline"))
        .mockResolvedValueOnce(page([makeReport()]));
    render(<MyReportsScreen />);

    expect(await screen.findByText(tr("reports.loadError"))).toBeTruthy();
    fireEvent.press(screen.getByText(tr("common.retry")));

    expect(await screen.findByText("ATROPELAMENTO")).toBeTruthy();
});

it("carrega a próxima página pelo rodapé", async () => {
    getMyReports
        .mockResolvedValueOnce(page([makeReport({ id: "r1", tipo_acidente: "PRIMEIRO" })], 1, 2))
        .mockResolvedValueOnce(page([makeReport({ id: "r2", tipo_acidente: "SEGUNDO" })], 2, 2));
    render(<MyReportsScreen />);
    await screen.findByText("PRIMEIRO");

    await act(async () => {
        fireEvent.press(screen.getByText(tr("reports.loadMore")));
    });

    expect(await screen.findByText("SEGUNDO")).toBeTruthy();
    await waitFor(() => expect(screen.queryByText(tr("reports.loadMore"))).toBeNull());
});

it("volta ao perfil", async () => {
    getMyReports.mockResolvedValue(page([]));
    render(<MyReportsScreen />);
    await screen.findByText(tr("reports.emptyMessage"));

    fireEvent.press(screen.getByLabelText(tr("settings.backToProfile")));

    expect(router.dismissTo).toHaveBeenCalledWith("/profile");
});
