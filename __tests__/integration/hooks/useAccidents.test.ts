/**
 * Hook do mapa de acidentes com o serviço de acidentes SIMULADO.
 *
 * O hook mantém um cache no escopo do módulo (sobrevive à desmontagem da
 * tela). Para que nenhum teste dependa de outro, cada teste carrega uma
 * cópia nova do módulo, do React e da Testing Library (`isolateModules`).
 */
import type { Accident, AccidentMapFilters } from "@/src/features/map/types/accident.types";
import { makeAccident } from "@/test/fixtures";
import { silenceConsole } from "@/test/utils/console";

jest.mock("@/src/features/map/services/accidentService");

type Testing = typeof import("@testing-library/react-native/pure");
type Hook = typeof import("@/src/features/map/hooks/useAccidents").useAccidents;
type Service = jest.Mocked<typeof import("@/src/features/map/services/accidentService")>;
type Tr = typeof import("@/src/i18n").tr;

let rtl: Testing;
let useAccidents: Hook;
let service: Service;
let tr: Tr;

beforeEach(() => {
    jest.isolateModules(() => {
        rtl = require("@testing-library/react-native/pure");
        useAccidents = require("@/src/features/map/hooks/useAccidents").useAccidents;
        service = require("@/src/features/map/services/accidentService");
        const i18n = require("@/src/i18n");
        i18n.useLanguageStore.setState({ preference: "pt-BR" });
        tr = i18n.tr;
    });
    service.getAccidentsMapVersion.mockResolvedValue("v1");
});

afterEach(async () => {
    await rtl.cleanupAsync();
});

const deferred = <T,>() => {
    let resolve!: (value: T) => void;
    let reject!: (error: unknown) => void;
    const promise = new Promise<T>((res, rej) => {
        resolve = res;
        reject = rej;
    });
    return { promise, resolve, reject };
};

it("carrega os acidentes ao montar", async () => {
    const accidents = [makeAccident()];
    service.getAccidentsForMap.mockResolvedValue(accidents);

    const { result } = rtl.renderHook(() => useAccidents());

    expect(result.current.isLoading).toBe(true);
    await rtl.waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.accidents).toEqual(accidents);
    expect(result.current.error).toBeNull();
    expect(service.getAccidentsForMap).toHaveBeenCalledWith({});
});

it("exibe erro quando a carga falha", async () => {
    silenceConsole();
    service.getAccidentsForMap.mockRejectedValue(new Error("offline"));

    const { result } = rtl.renderHook(() => useAccidents());

    await rtl.waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.error).toBe(tr("map.loadError"));
    expect(result.current.accidents).toEqual([]);
});

it("continua carregando mesmo sem conseguir ler a versão dos dados", async () => {
    service.getAccidentsMapVersion.mockRejectedValue(new Error("404"));
    service.getAccidentsForMap.mockResolvedValue([makeAccident()]);

    const { result } = rtl.renderHook(() => useAccidents());

    await rtl.waitFor(() => expect(result.current.accidents).toHaveLength(1));
    expect(result.current.error).toBeNull();
});

it("reaproveita os dados em cache ao remontar a tela", async () => {
    service.getAccidentsForMap.mockResolvedValue([makeAccident()]);
    const first = rtl.renderHook(() => useAccidents());
    await rtl.waitFor(() => expect(first.result.current.isLoading).toBe(false));
    first.unmount();

    const second = rtl.renderHook(() => useAccidents());
    // Aguarda efeitos pendentes: nenhuma nova carga deve ser disparada.
    await rtl.act(async () => {});

    expect(second.result.current.isLoading).toBe(false);
    expect(second.result.current.accidents).toHaveLength(1);
    expect(service.getAccidentsForMap).toHaveBeenCalledTimes(1);
});

it("aplica e limpa filtros consultando a API", async () => {
    service.getAccidentsForMap.mockResolvedValue([]);
    const { result } = rtl.renderHook(() => useAccidents());
    await rtl.waitFor(() => expect(result.current.isLoading).toBe(false));

    rtl.act(() => result.current.applyFilters({ severity: "critical" }));
    await rtl.waitFor(() =>
        expect(service.getAccidentsForMap).toHaveBeenLastCalledWith({
            severity: "critical",
        }),
    );

    rtl.act(() => result.current.clearFilters());
    await rtl.waitFor(() =>
        expect(service.getAccidentsForMap).toHaveBeenLastCalledWith({}),
    );
    expect(result.current.filters).toEqual({});
});

it("descarta a resposta de um filtro anterior que chega atrasada", async () => {
    const slow = deferred<Accident[]>();
    const fast = deferred<Accident[]>();
    service.getAccidentsForMap
        .mockResolvedValueOnce([])
        .mockReturnValueOnce(slow.promise)
        .mockReturnValueOnce(fast.promise);
    const { result } = rtl.renderHook(() => useAccidents());
    await rtl.waitFor(() => expect(result.current.isLoading).toBe(false));

    rtl.act(() => result.current.applyFilters({ severity: "low" }));
    rtl.act(() => result.current.applyFilters({ severity: "high" }));
    await rtl.act(async () => {
        fast.resolve([makeAccident({ id: "high", severity: "high" })]);
    });
    await rtl.act(async () => {
        slow.resolve([makeAccident({ id: "low", severity: "low" })]);
    });

    expect(result.current.accidents.map((accident) => accident.id)).toEqual([
        "high",
    ]);
});

it("'tentar novamente' refaz a carga mesmo com cache", async () => {
    silenceConsole();
    service.getAccidentsForMap
        .mockRejectedValueOnce(new Error("offline"))
        .mockResolvedValueOnce([makeAccident()]);
    const { result } = rtl.renderHook(() => useAccidents());
    await rtl.waitFor(() => expect(result.current.error).not.toBeNull());

    rtl.act(() => result.current.retry());

    await rtl.waitFor(() => expect(result.current.accidents).toHaveLength(1));
    expect(result.current.error).toBeNull();
});

it("atualização em segundo plano que falha mantém o mapa exibido", async () => {
    silenceConsole();
    service.getAccidentsForMap.mockResolvedValueOnce([makeAccident()]);
    const { result } = rtl.renderHook(() => useAccidents());
    await rtl.waitFor(() => expect(result.current.isLoading).toBe(false));

    service.getAccidentsForMap.mockRejectedValueOnce(new Error("offline"));
    await rtl.act(async () => {
        result.current.refreshSilently();
    });

    expect(result.current.accidents).toHaveLength(1);
    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(false);
});

describe("checkForUpdates", () => {
    it("não baixa de novo quando a versão não mudou", async () => {
        service.getAccidentsForMap.mockResolvedValue([makeAccident()]);
        const { result } = rtl.renderHook(() => useAccidents());
        await rtl.waitFor(() => expect(result.current.isLoading).toBe(false));

        await rtl.act(() => result.current.checkForUpdates());

        expect(service.getAccidentsForMap).toHaveBeenCalledTimes(1);
    });

    it("baixa de novo quando a versão mudou", async () => {
        service.getAccidentsForMap
            .mockResolvedValueOnce([makeAccident()])
            .mockResolvedValueOnce([makeAccident(), makeAccident({ id: "acc-2" })]);
        const { result } = rtl.renderHook(() => useAccidents());
        await rtl.waitFor(() => expect(result.current.isLoading).toBe(false));

        service.getAccidentsMapVersion.mockResolvedValue("v2");
        await rtl.act(() => result.current.checkForUpdates());

        expect(service.getAccidentsForMap).toHaveBeenCalledTimes(2);
        expect(result.current.accidents).toHaveLength(2);
    });
});

describe("revealAccident (abrir acidente vindo de notificação)", () => {
    it("encontra o acidente com os filtros atuais", async () => {
        const target = makeAccident({ id: "target" });
        service.getAccidentsForMap.mockResolvedValue([target]);
        const { result } = rtl.renderHook(() => useAccidents());
        await rtl.waitFor(() => expect(result.current.isLoading).toBe(false));

        let found: Accident | null = null;
        await rtl.act(async () => {
            found = await result.current.revealAccident("target");
        });

        expect(found).toEqual(target);
    });

    it("limpa os filtros quando eles escondem o acidente", async () => {
        const filters: AccidentMapFilters = { severity: "low" };
        const target = makeAccident({ id: "target", severity: "critical" });
        service.getAccidentsForMap.mockImplementation(async (requested = {}) =>
            requested.severity ? [] : [target],
        );
        const { result } = rtl.renderHook(() => useAccidents());
        await rtl.waitFor(() => expect(result.current.isLoading).toBe(false));
        rtl.act(() => result.current.applyFilters(filters));
        await rtl.waitFor(() => expect(result.current.filters).toEqual(filters));

        let found: Accident | null = null;
        await rtl.act(async () => {
            found = await result.current.revealAccident("target");
        });

        expect(found).toEqual(target);
        expect(result.current.filters).toEqual({});
        expect(result.current.accidents).toEqual([target]);
    });

    it("devolve null quando o acidente não existe", async () => {
        service.getAccidentsForMap.mockResolvedValue([makeAccident()]);
        const { result } = rtl.renderHook(() => useAccidents());
        await rtl.waitFor(() => expect(result.current.isLoading).toBe(false));

        let found: Accident | null = makeAccident();
        await rtl.act(async () => {
            found = await result.current.revealAccident("inexistente");
        });

        expect(found).toBeNull();
    });
});
