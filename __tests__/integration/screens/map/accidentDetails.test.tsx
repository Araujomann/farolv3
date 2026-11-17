/**
 * Tela de detalhes do acidente: regras de quem pode dar selo de confiança
 * e comentar, conforme a origem do relato e a verificação do e-mail.
 * Serviços de acidente e geocodificação SIMULADOS.
 */
import { act, fireEvent, render, screen } from "@testing-library/react-native";

import AccidentDetailsScreen from "@/app/(tabs)/map/[accidentId]";
import { verifyEmailFromAppRoute } from "@/src/features/auth/verifyEmailRoute";
import * as service from "@/src/features/map/services/accidentService";
import * as geocoding from "@/src/features/map/services/reverseGeocode";
import { tr } from "@/src/i18n";
import { useAuthStore } from "@/src/store/authStore";
import { makeAccidentDetail, makeComment, makeUser } from "@/test/fixtures";
import { __setParams, router } from "@/test/mocks/expoRouter";
import { silenceConsole } from "@/test/utils/console";

jest.mock("expo-router", () => require("@/test/mocks/expoRouter"));
jest.mock("@/src/features/map/services/accidentService");
jest.mock("@/src/features/map/services/reverseGeocode");

const mocked = jest.mocked(service);

const renderDetails = async (
    detail = makeAccidentDetail(),
    user = makeUser(),
) => {
    useAuthStore.setState({ user, token: "t", isLoading: false });
    mocked.getAccidentDetails.mockResolvedValue(detail);
    render(<AccidentDetailsScreen />);
    await screen.findByText(tr("accident.reliability"));
    await screen.findByText("Av. Getúlio Vargas, Imperatriz");
};

beforeEach(() => {
    __setParams({ accidentId: "acc-1" });
    mocked.getAccidentTrust.mockResolvedValue({ trusted_count: 2, trusted_by_me: false });
    jest.mocked(geocoding.reverseGeocode).mockResolvedValue("Av. Getúlio Vargas, Imperatriz");
});

it("exibe descrição, endereço, selos e comentários do relato", async () => {
    await renderDetails(
        makeAccidentDetail({ comments: [makeComment({ body: "Pista molhada" })] }),
    );

    expect(mocked.getAccidentDetails).toHaveBeenCalledWith("acc-1");
    expect(screen.getByText("Colisão entre dois carros no cruzamento.")).toBeTruthy();
    expect(screen.getByText("2")).toBeTruthy();
    expect(screen.getByText("Pista molhada")).toBeTruthy();
});

it("usuário verificado pode dar o selo a relato de outra pessoa", async () => {
    mocked.setAccidentTrust.mockResolvedValue({ trusted_count: 3, trusted_by_me: true });
    await renderDetails();

    await act(async () => {
        fireEvent.press(screen.getByText(tr("accident.markTrusted")));
    });

    expect(mocked.setAccidentTrust).toHaveBeenCalledWith("acc-1", true);
    expect(screen.getByText("3")).toBeTruthy();
    expect(screen.getByText(tr("accident.removeTrust"))).toBeTruthy();
});

it("não permite dar selo ao próprio relato", async () => {
    await renderDetails(makeAccidentDetail({ created_by_id: "user-1" }));

    fireEvent.press(screen.getByText(tr("accident.ownReport")));

    expect(mocked.setAccidentTrust).not.toHaveBeenCalled();
});

it("não permite dar selo a registros da PRF", async () => {
    await renderDetails(makeAccidentDetail({ source: "PRF", created_by_id: null }));

    fireEvent.press(screen.getByText(tr("accident.trustOnlyCommunity")));

    expect(mocked.setAccidentTrust).not.toHaveBeenCalled();
});

describe("conta com e-mail não verificado", () => {
    const unverified = makeUser({ is_email_verified: false });

    it("não pode dar selo", async () => {
        await renderDetails(makeAccidentDetail(), unverified);

        fireEvent.press(screen.getByText(tr("accident.verifyToVote")));

        expect(mocked.setAccidentTrust).not.toHaveBeenCalled();
    });

    it("pode remover um selo dado antes", async () => {
        mocked.getAccidentTrust.mockResolvedValue({ trusted_count: 1, trusted_by_me: true });
        mocked.setAccidentTrust.mockResolvedValue({ trusted_count: 0, trusted_by_me: false });
        await renderDetails(makeAccidentDetail(), unverified);

        await act(async () => {
            fireEvent.press(screen.getByText(tr("accident.removeTrust")));
        });

        expect(mocked.setAccidentTrust).toHaveBeenCalledWith("acc-1", false);
    });

    it("não vê o campo de comentário e é levada à verificação", async () => {
        await renderDetails(makeAccidentDetail(), unverified);

        expect(screen.queryByLabelText(tr("accident.addComment"))).toBeNull();
        fireEvent.press(screen.getByLabelText(tr("accident.verifyToComment")));

        expect(router.push).toHaveBeenCalledWith(verifyEmailFromAppRoute);
    });
});

it("publica comentário e o mostra na lista", async () => {
    mocked.createAccidentComment.mockResolvedValue(
        makeComment({ id: "new", body: "Semáforo apagado", author_name: "Maria Silva" }),
    );
    await renderDetails();

    fireEvent.changeText(screen.getByLabelText(tr("accident.addComment")), "Semáforo apagado");
    await act(async () => {
        fireEvent.press(screen.getByLabelText(tr("accident.sendComment")));
    });

    expect(mocked.createAccidentComment).toHaveBeenCalledWith("acc-1", "Semáforo apagado");
    expect(screen.getByText("Semáforo apagado")).toBeTruthy();
    expect(screen.getByText("Comentários (1)")).toBeTruthy();
});

it("mostra erro e permite recarregar quando o acidente não carrega", async () => {
    silenceConsole();
    mocked.getAccidentDetails
        .mockRejectedValueOnce(new Error("offline"))
        .mockResolvedValueOnce(makeAccidentDetail());
    useAuthStore.setState({ user: makeUser() });
    render(<AccidentDetailsScreen />);

    expect(await screen.findByText(tr("accident.loadError"))).toBeTruthy();
    await act(async () => {
        fireEvent.press(screen.getByText(tr("common.retry")));
    });

    expect(await screen.findByText(tr("accident.reliability"))).toBeTruthy();
});
