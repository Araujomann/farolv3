import type { InternalAxiosRequestConfig } from "axios";

import {
    beginRequestTracking,
    endRequestTracking,
    useServerStatusStore,
} from "@/src/api/serverStatus";

const makeConfig = () => ({ headers: {} }) as InternalAxiosRequestConfig;
const slowRequests = () => useServerStatusStore.getState().slowRequests;

describe("detecção de requisições lentas (API hibernando)", () => {
    beforeEach(() => {
        jest.useFakeTimers();
        useServerStatusStore.setState({ slowRequests: 0 });
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it("não marca requisições que terminam antes de 4 s", () => {
        const config = makeConfig();
        beginRequestTracking(config);

        jest.advanceTimersByTime(3_999);
        endRequestTracking(config);
        jest.advanceTimersByTime(10_000);

        expect(slowRequests()).toBe(0);
    });

    it("marca a requisição como lenta após 4 s e desmarca ao terminar", () => {
        const config = makeConfig();
        beginRequestTracking(config);

        jest.advanceTimersByTime(4_000);
        expect(slowRequests()).toBe(1);

        endRequestTracking(config);
        expect(slowRequests()).toBe(0);
    });

    it("conta várias requisições lentas simultâneas", () => {
        const first = makeConfig();
        const second = makeConfig();
        beginRequestTracking(first);
        beginRequestTracking(second);
        jest.advanceTimersByTime(5_000);

        expect(slowRequests()).toBe(2);
        endRequestTracking(first);
        expect(slowRequests()).toBe(1);
    });

    it("não conta duas vezes uma requisição refeita com o mesmo config", () => {
        const config = makeConfig();
        beginRequestTracking(config);
        jest.advanceTimersByTime(5_000);

        // Refeita após renovar o token: reaproveita o objeto de config.
        beginRequestTracking(config);
        expect(slowRequests()).toBe(0);

        jest.advanceTimersByTime(5_000);
        expect(slowRequests()).toBe(1);
    });

    it("tolera encerrar o acompanhamento sem config ou duas vezes", () => {
        const config = makeConfig();
        beginRequestTracking(config);
        jest.advanceTimersByTime(5_000);

        endRequestTracking(undefined);
        endRequestTracking(config);
        endRequestTracking(config);

        expect(slowRequests()).toBe(0);
    });
});
