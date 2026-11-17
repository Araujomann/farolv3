/**
 * "Meus relatos": carga paginada por status de moderação com a API de
 * relatos SIMULADA.
 */
import { act, renderHook, waitFor } from "@testing-library/react-native";

import * as reportsApi from "@/src/api/reports";
import type { ReportStatus } from "@/src/api/reports";
import { useMyReports } from "@/src/features/profile/hooks/useMyReports";
import { tr } from "@/src/i18n";
import { makeReport } from "@/test/fixtures";
import { silenceConsole } from "@/test/utils/console";

jest.mock("expo-router", () => require("@/test/mocks/expoRouter"));
jest.mock("@/src/api/reports");
const getMyReports = jest.mocked(reportsApi.getMyReports);

const page = (ids: string[], current: number, totalPages: number) => ({
    data: ids.map((id) => makeReport({ id })),
    pagination: { page: current, limit: 20, total: ids.length, totalPages },
});

const loaded = async (status: ReportStatus = "APPROVED") => {
    const hook = renderHook(({ value }: { value: ReportStatus }) => useMyReports(value), {
        initialProps: { value: status },
    });
    await waitFor(() => expect(hook.result.current.isLoading).toBe(false));
    return hook;
};

it("carrega a primeira página do status selecionado", async () => {
    getMyReports.mockResolvedValue(page(["r1", "r2"], 1, 1));

    const { result } = await loaded("PENDING");

    expect(getMyReports).toHaveBeenCalledWith({ status: "PENDING", page: 1, limit: 20 });
    expect(result.current.reports.map((report) => report.id)).toEqual(["r1", "r2"]);
});

it("acrescenta a próxima página ao carregar mais", async () => {
    getMyReports
        .mockResolvedValueOnce(page(["r1"], 1, 2))
        .mockResolvedValueOnce(page(["r2"], 2, 2));
    const { result } = await loaded();

    await act(() => result.current.loadMore());

    expect(getMyReports).toHaveBeenLastCalledWith({ status: "APPROVED", page: 2, limit: 20 });
    expect(result.current.reports.map((report) => report.id)).toEqual(["r1", "r2"]);
    expect(result.current.page).toBe(2);
});

it("não pede páginas além da última", async () => {
    getMyReports.mockResolvedValue(page(["r1"], 1, 1));
    const { result } = await loaded();

    await act(() => result.current.loadMore());

    expect(getMyReports).toHaveBeenCalledTimes(1);
});

it("exibe erro quando a primeira carga falha", async () => {
    silenceConsole();
    getMyReports.mockRejectedValue(new Error("offline"));

    const { result } = await loaded();

    expect(result.current.error).toBe(tr("reports.loadError"));
    expect(result.current.reports).toEqual([]);
});

it("mantém a lista quando 'carregar mais' falha", async () => {
    silenceConsole();
    getMyReports
        .mockResolvedValueOnce(page(["r1"], 1, 2))
        .mockRejectedValueOnce(new Error("offline"));
    const { result } = await loaded();

    await act(() => result.current.loadMore());

    expect(result.current.loadMoreError).toBe(true);
    expect(result.current.reports).toHaveLength(1);
    expect(result.current.isLoadingMore).toBe(false);
});

it("recarrega do zero ao trocar de status", async () => {
    getMyReports
        .mockResolvedValueOnce(page(["a1"], 1, 1))
        .mockResolvedValueOnce(page(["x1"], 1, 1));
    const hook = await loaded("APPROVED");

    hook.rerender({ value: "REJECTED" });

    await waitFor(() =>
        expect(hook.result.current.reports.map((report) => report.id)).toEqual(["x1"]),
    );
    expect(getMyReports).toHaveBeenLastCalledWith({ status: "REJECTED", page: 1, limit: 20 });
});
