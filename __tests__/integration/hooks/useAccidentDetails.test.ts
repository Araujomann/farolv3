/**
 * Detalhes do acidente (carga, selos de confiança, comentários e abertura
 * no mapa externo) com o serviço de acidentes SIMULADO.
 */
import { act, renderHook, waitFor } from "@testing-library/react-native";
import { Alert, Linking } from "react-native";

import { useAccidentDetails } from "@/src/features/map/hooks/useAccidentDetails";
import * as service from "@/src/features/map/services/accidentService";
import { tr } from "@/src/i18n";
import { makeAccidentDetail, makeComment } from "@/test/fixtures";
import { silenceConsole } from "@/test/utils/console";

jest.mock("@/src/features/map/services/accidentService");
const mocked = jest.mocked(service);

const loaded = async (...args: [] | [string | undefined]) => {
    const accidentId = args.length === 0 ? "acc-1" : args[0];
    const hook = renderHook(() => useAccidentDetails(accidentId));
    await waitFor(() => expect(hook.result.current.isLoading).toBe(false));
    return hook;
};

beforeEach(() => {
    mocked.getAccidentDetails.mockResolvedValue(makeAccidentDetail({ trusted_count: 2 }));
    mocked.getAccidentTrust.mockResolvedValue({ trusted_count: 5, trusted_by_me: true });
});

describe("carregamento", () => {
    it("une os detalhes aos selos de confiança atualizados", async () => {
        const { result } = await loaded();

        expect(result.current.accident?.trusted_count).toBe(5);
        expect(result.current.trustedByMe).toBe(true);
        expect(result.current.error).toBeNull();
        expect(result.current.trustError).toBeNull();
    });

    it("exibe os detalhes mesmo se os selos falharem, com aviso", async () => {
        silenceConsole();
        mocked.getAccidentTrust.mockRejectedValue(new Error("500"));

        const { result } = await loaded();

        expect(result.current.accident?.trusted_count).toBe(2);
        expect(result.current.trustedByMe).toBe(false);
        expect(result.current.trustError).toBe(tr("accident.trustLoadError"));
    });

    it("exibe erro quando os detalhes não carregam", async () => {
        silenceConsole();
        mocked.getAccidentDetails.mockRejectedValue(new Error("404"));

        const { result } = await loaded();

        expect(result.current.accident).toBeNull();
        expect(result.current.error).toBe(tr("accident.loadError"));
    });

    it("recusa ID ausente sem chamar a API", async () => {
        const { result } = await loaded(undefined);

        expect(result.current.error).toBe(tr("accident.invalidId"));
        expect(mocked.getAccidentDetails).not.toHaveBeenCalled();
    });

    it("tentar novamente recarrega após uma falha", async () => {
        silenceConsole();
        mocked.getAccidentDetails.mockRejectedValueOnce(new Error("offline"));
        const { result } = await loaded();
        expect(result.current.error).not.toBeNull();

        await act(() => result.current.loadAccident());

        expect(result.current.error).toBeNull();
        expect(result.current.accident).not.toBeNull();
    });
});

describe("comentários", () => {
    it("publica o texto sem espaços nas pontas e o acrescenta à lista", async () => {
        const created = makeComment({ id: "new", body: "Pista interditada" });
        mocked.createAccidentComment.mockResolvedValue(created);
        const { result } = await loaded();

        act(() => result.current.setComment("  Pista interditada  "));
        await act(() => result.current.handleSendComment());

        expect(mocked.createAccidentComment).toHaveBeenCalledWith(
            "acc-1",
            "Pista interditada",
        );
        expect(result.current.accident?.comments).toEqual([created]);
        expect(result.current.comment).toBe("");
    });

    it("não envia comentário vazio", async () => {
        const { result } = await loaded();

        act(() => result.current.setComment("   "));
        await act(() => result.current.handleSendComment());

        expect(mocked.createAccidentComment).not.toHaveBeenCalled();
    });

    it("mantém o texto e exibe erro quando a publicação falha", async () => {
        silenceConsole();
        mocked.createAccidentComment.mockRejectedValue(new Error("500"));
        const { result } = await loaded();

        act(() => result.current.setComment("Olá"));
        await act(() => result.current.handleSendComment());

        expect(result.current.commentError).toBe(tr("accident.commentError"));
        expect(result.current.comment).toBe("Olá");
        expect(result.current.isSendingComment).toBe(false);
    });
});

describe("selo de confiança", () => {
    it("alterna o selo e atualiza a contagem com a resposta da API", async () => {
        mocked.getAccidentTrust.mockResolvedValue({ trusted_count: 1, trusted_by_me: false });
        mocked.setAccidentTrust.mockResolvedValue({ trusted_count: 2, trusted_by_me: true });
        const { result } = await loaded();

        await act(() => result.current.handleToggleTrust());

        expect(mocked.setAccidentTrust).toHaveBeenCalledWith("acc-1", true);
        expect(result.current.trustedByMe).toBe(true);
        expect(result.current.accident?.trusted_count).toBe(2);
    });

    it("remove o selo já dado", async () => {
        mocked.setAccidentTrust.mockResolvedValue({ trusted_count: 4, trusted_by_me: false });
        const { result } = await loaded();

        await act(() => result.current.handleToggleTrust());

        expect(mocked.setAccidentTrust).toHaveBeenCalledWith("acc-1", false);
    });

    it("mantém o estado anterior quando a API recusa", async () => {
        silenceConsole();
        mocked.setAccidentTrust.mockRejectedValue(new Error("403"));
        const { result } = await loaded();

        await act(() => result.current.handleToggleTrust());

        expect(result.current.trustedByMe).toBe(true);
        expect(result.current.accident?.trusted_count).toBe(5);
        expect(result.current.trustError).toBe(tr("accident.trustError"));
    });
});

describe("abrir no mapa externo", () => {
    it("abre o Google Maps nas coordenadas do acidente", async () => {
        const openURL = jest.spyOn(Linking, "openURL").mockResolvedValue(true);
        const { result } = await loaded();

        await act(() => result.current.handleOpenMap());

        expect(openURL).toHaveBeenCalledWith(
            "https://maps.google.com/?q=-5.52693,-47.47812",
        );
    });

    it("avisa o usuário quando não há app para abrir o link", async () => {
        silenceConsole();
        jest.spyOn(Linking, "openURL").mockRejectedValue(new Error("no app"));
        const alert = jest.spyOn(Alert, "alert").mockImplementation(() => undefined);
        const { result } = await loaded();

        await act(() => result.current.handleOpenMap());

        expect(alert).toHaveBeenCalledWith(
            tr("accident.openMapErrorTitle"),
            tr("accident.openMapErrorMessage"),
        );
    });
});
