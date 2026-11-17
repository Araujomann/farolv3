/**
 * Hooks da Home e do perfil que consomem estatísticas da API (SIMULADA) e
 * reagem à notificação de acidente aprovado (`expo-notifications` simulado).
 */
import { act, renderHook, waitFor } from "@testing-library/react-native";

import * as accidentsApi from "@/src/api/accidents";
import * as profileApi from "@/src/api/profile";
import { useHomeDashboard } from "@/src/features/home/hooks/useHomeDashboard";
import { useTimeOfDayStats } from "@/src/features/home/hooks/useTimeOfDayStats";
import * as accidentService from "@/src/features/map/services/accidentService";
import { useGamificationStats } from "@/src/features/profile/hooks/useGamificationStats";
import { tr } from "@/src/i18n";
import { makeAccident, makeOverview } from "@/test/fixtures";
import {
    __emitReceived,
    __listenerCount,
    makeNotification,
} from "@/test/mocks/expoNotifications";
import { silenceConsole } from "@/test/utils/console";

jest.mock("expo-router", () => require("@/test/mocks/expoRouter"));
jest.mock("@/src/api/profile");
jest.mock("@/src/features/map/services/accidentService");
jest.mock("@/src/api/accidents", () => ({
    ...jest.requireActual("@/src/api/accidents"),
    getAccidentOverview: jest.fn(),
}));

const getOverview = jest.mocked(accidentsApi.getAccidentOverview);
const getStats = jest.mocked(profileApi.getMyGamificationStats);
const getMapAccidents = jest.mocked(accidentService.getAccidentsForMap);

const approvedNotification = makeNotification({
    type: "ACCIDENT_APPROVED",
    accidentId: "acc-9",
});

describe("useHomeDashboard", () => {
    beforeEach(() => {
        getOverview.mockResolvedValue(makeOverview());
        getStats.mockResolvedValue({
            approved_reports_count: 2,
            received_trust_votes_count: 7,
        });
    });

    const loaded = async () => {
        const hook = renderHook(() => useHomeDashboard());
        await waitFor(() => expect(hook.result.current.isLoading).toBe(false));
        return hook;
    };

    it("carrega o panorama da comunidade e a contribuição pessoal", async () => {
        const { result } = await loaded();

        expect(result.current.overview).toEqual(makeOverview());
        expect(result.current.personalStats).toEqual({
            approved_reports_count: 2,
            received_trust_votes_count: 7,
        });
        expect(result.current.communityError).toBeNull();
        expect(result.current.personalError).toBeNull();
    });

    it("trata as duas fontes de forma independente", async () => {
        silenceConsole();
        getStats.mockRejectedValue(new Error("offline"));

        const { result } = await loaded();

        expect(result.current.overview).not.toBeNull();
        expect(result.current.communityError).toBeNull();
        expect(result.current.personalError).toBe(tr("home.personalConnectionError"));
    });

    it("recusa estatísticas inválidas da API", async () => {
        silenceConsole();
        getOverview.mockResolvedValue(makeOverview({ approved_accidents_count: -1 }));
        getStats.mockResolvedValue({
            approved_reports_count: 1.5,
            received_trust_votes_count: 0,
        });

        const { result } = await loaded();

        expect(result.current.overview).toBeNull();
        expect(result.current.communityError).toBe(tr("home.invalidStats"));
        expect(result.current.personalError).toBe(tr("home.invalidPersonalStats"));
    });

    it("informa falha de conexão do panorama", async () => {
        silenceConsole();
        getOverview.mockRejectedValue(new Error("offline"));

        const { result } = await loaded();

        expect(result.current.communityError).toBe(tr("home.connectionError"));
    });

    it("recarrega ao receber a notificação de acidente aprovado", async () => {
        await loaded();
        expect(getOverview).toHaveBeenCalledTimes(1);

        await act(async () => {
            __emitReceived(approvedNotification);
        });

        await waitFor(() => expect(getOverview).toHaveBeenCalledTimes(2));
    });

    it("ignora outras notificações e remove o listener ao sair", async () => {
        const { unmount } = await loaded();

        await act(async () => {
            __emitReceived(makeNotification({ type: "ADMIN_NOTICE" }));
        });
        expect(getOverview).toHaveBeenCalledTimes(1);

        unmount();
        expect(__listenerCount()).toBe(0);
    });

    it("mostra o indicador de atualização ao puxar para recarregar", async () => {
        const { result } = await loaded();
        let finish: () => void = () => undefined;
        getOverview.mockReturnValueOnce(
            new Promise((resolve) => {
                finish = () => resolve(makeOverview());
            }),
        );

        act(() => {
            void result.current.loadDashboard(true);
        });
        expect(result.current.isRefreshing).toBe(true);
        expect(result.current.isLoading).toBe(false);

        await act(async () => finish());
        await waitFor(() => expect(result.current.isRefreshing).toBe(false));
    });
});

describe("useGamificationStats", () => {
    it("carrega a progressão do usuário", async () => {
        getStats.mockResolvedValue({
            approved_reports_count: 4,
            received_trust_votes_count: 9,
        });

        const { result } = renderHook(() => useGamificationStats());

        await waitFor(() => expect(result.current.isLoadingGamification).toBe(false));
        expect(result.current.approvedReportsCount).toBe(4);
        expect(result.current.receivedTrustVotesCount).toBe(9);
    });

    it("recusa contagem negativa", async () => {
        silenceConsole();
        getStats.mockResolvedValue({
            approved_reports_count: -1,
            received_trust_votes_count: 0,
        });

        const { result } = renderHook(() => useGamificationStats());

        await waitFor(() => expect(result.current.isLoadingGamification).toBe(false));
        expect(result.current.approvedReportsCount).toBeNull();
        expect(result.current.gamificationError).toBe(tr("profile.progressError"));
    });

    it("recarrega quando um relato do usuário é aprovado", async () => {
        getStats.mockResolvedValue({
            approved_reports_count: 1,
            received_trust_votes_count: 0,
        });
        const { result } = renderHook(() => useGamificationStats());
        await waitFor(() => expect(result.current.isLoadingGamification).toBe(false));

        getStats.mockResolvedValue({
            approved_reports_count: 2,
            received_trust_votes_count: 0,
        });
        await act(async () => {
            __emitReceived(approvedNotification);
        });

        await waitFor(() => expect(result.current.approvedReportsCount).toBe(2));
    });
});

describe("useTimeOfDayStats", () => {
    const overviewTimeOfDay = makeOverview().time_of_day;

    it("usa as faixas do panorama para os últimos 30 dias, sem nova requisição", () => {
        const { result } = renderHook(() => useTimeOfDayStats(overviewTimeOfDay));

        expect(result.current.period).toBe("last30Days");
        expect(result.current.timeOfDay).toBe(overviewTimeOfDay);
        expect(getMapAccidents).not.toHaveBeenCalled();
    });

    it("conta os acidentes do período escolhido a partir do mapa", async () => {
        getMapAccidents.mockResolvedValue([
            makeAccident({ occurred_at: "2026-11-16T17:30:00.000Z" }), // 14:30 local
        ]);
        const { result } = renderHook(() => useTimeOfDayStats(overviewTimeOfDay));

        act(() => result.current.setPeriod("annual"));

        await waitFor(() => expect(result.current.isLoading).toBe(false));
        const filters = getMapAccidents.mock.calls[0][0];
        expect(filters).toEqual({ from: expect.any(String), to: expect.any(String) });
        expect(result.current.timeOfDay?.[4]).toEqual({ start_hour: 12, count: 1 });
        expect(
            result.current.timeOfDay?.reduce((sum, item) => sum + item.count, 0),
        ).toBe(1);
    });

    it("descarta a resposta de um período que o usuário já trocou", async () => {
        let finishAnnual: () => void = () => undefined;
        getMapAccidents
            .mockReturnValueOnce(
                new Promise((resolve) => {
                    finishAnnual = () => resolve([makeAccident(), makeAccident()]);
                }),
            )
            .mockResolvedValueOnce([makeAccident()]);
        const { result } = renderHook(() => useTimeOfDayStats(overviewTimeOfDay));

        act(() => result.current.setPeriod("annual"));
        act(() => result.current.setPeriod("quarterly"));
        await waitFor(() => expect(result.current.isLoading).toBe(false));
        await act(async () => finishAnnual());

        expect(
            result.current.timeOfDay?.reduce((sum, item) => sum + item.count, 0),
        ).toBe(1);
    });

    it("sinaliza erro e permite tentar de novo", async () => {
        silenceConsole();
        getMapAccidents
            .mockRejectedValueOnce(new Error("offline"))
            .mockResolvedValueOnce([]);
        const { result } = renderHook(() => useTimeOfDayStats(overviewTimeOfDay));

        act(() => result.current.setPeriod("biennial"));
        await waitFor(() => expect(result.current.hasError).toBe(true));

        act(() => result.current.retry());

        await waitFor(() => expect(result.current.hasError).toBe(false));
        expect(getMapAccidents).toHaveBeenCalledTimes(2);
    });
});
