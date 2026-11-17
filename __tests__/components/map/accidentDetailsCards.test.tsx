/**
 * Cartões da tela de detalhes do acidente: selo de confiança, comentários
 * e alternância de visualização do mapa.
 */
import { fireEvent, render, screen } from "@testing-library/react-native";

import { MapErrorOverlay, MapEmptyOverlay, MapLoadingOverlay } from "@/src/features/map/components/MapStatusOverlays";
import { MapViewModeToggle } from "@/src/features/map/components/MapViewModeToggle";
import { AccidentComments } from "@/src/features/map/components/details/AccidentComments";
import { AccidentTrustCard } from "@/src/features/map/components/details/AccidentTrustCard";
import { tr } from "@/src/i18n";
import { makeComment } from "@/test/fixtures";

describe("AccidentTrustCard", () => {
    const baseProps = {
        trustedCount: 3,
        trustedByMe: false,
        canTrust: true,
        isUpdatingTrust: false,
        isOwnReport: false,
        isEmailVerified: true,
        trustError: null,
        onToggleTrust: jest.fn(),
    };

    it("mostra a contagem com plural e permite dar o selo", () => {
        const onToggleTrust = jest.fn();
        render(<AccidentTrustCard {...baseProps} onToggleTrust={onToggleTrust} />);

        expect(screen.getByText("3")).toBeTruthy();
        expect(screen.getByText("selos")).toBeTruthy();
        fireEvent.press(screen.getByText(tr("accident.markTrusted")));

        expect(onToggleTrust).toHaveBeenCalled();
    });

    it("usa o singular para um selo", () => {
        render(<AccidentTrustCard {...baseProps} trustedCount={1} />);

        expect(screen.getByText("selo")).toBeTruthy();
    });

    it("oferece remover o selo já dado", () => {
        render(<AccidentTrustCard {...baseProps} trustedByMe />);

        expect(screen.getByText(tr("accident.trustedByYou"))).toBeTruthy();
        expect(screen.getByText(tr("accident.removeTrust"))).toBeTruthy();
    });

    it.each([
        ["o próprio relato", { isOwnReport: true }, "accident.ownReport"],
        ["e-mail não verificado", { isEmailVerified: false }, "accident.verifyToVote"],
        ["relato da PRF", {}, "accident.trustOnlyCommunity"],
    ] as const)("bloqueia o selo para %s e explica o motivo", (_label, props, key) => {
        const onToggleTrust = jest.fn();
        render(
            <AccidentTrustCard
                {...baseProps}
                {...props}
                canTrust={false}
                onToggleTrust={onToggleTrust}
            />,
        );

        fireEvent.press(screen.getByText(tr(key)));

        expect(onToggleTrust).not.toHaveBeenCalled();
        expect(screen.getByRole("button")).toBeDisabled();
    });

    it("bloqueia novos toques durante a atualização e exibe erro", () => {
        render(
            <AccidentTrustCard {...baseProps} isUpdatingTrust trustError="Falhou" />,
        );

        expect(screen.getByRole("button")).toBeDisabled();
        expect(screen.getByRole("alert")).toHaveTextContent("Falhou");
    });
});

describe("AccidentComments", () => {
    const baseProps = {
        comments: [],
        isEmailVerified: true,
        comment: "",
        onChangeComment: jest.fn(),
        onCommentFocus: jest.fn(),
        isSendingComment: false,
        commentError: null,
        onSendComment: jest.fn(),
        onVerifyEmail: jest.fn(),
    };

    it("mostra o estado vazio", () => {
        render(<AccidentComments {...baseProps} />);

        expect(screen.getByText(tr("accident.noComments"))).toBeTruthy();
        expect(screen.getByText("Comentários (0)")).toBeTruthy();
    });

    it("lista os comentários com autor, e 'membro da comunidade' sem nome", () => {
        render(
            <AccidentComments
                {...baseProps}
                comments={[
                    makeComment({ id: "1", author_name: "Ana", body: "Primeiro" }),
                    makeComment({ id: "2", author_name: null, body: "Segundo" }),
                ]}
            />,
        );

        expect(screen.getByText("Comentários (2)")).toBeTruthy();
        expect(screen.getByText("Ana")).toBeTruthy();
        expect(screen.getByText(tr("accident.communityMember"))).toBeTruthy();
        expect(screen.getByText("Segundo")).toBeTruthy();
    });

    it("só habilita o envio com texto não vazio", () => {
        const onSendComment = jest.fn();
        const { rerender } = render(
            <AccidentComments {...baseProps} comment="   " onSendComment={onSendComment} />,
        );
        const sendButton = () =>
            screen.getByRole("button", { name: tr("accident.sendComment") });

        expect(sendButton()).toBeDisabled();

        rerender(
            <AccidentComments {...baseProps} comment="Ok" onSendComment={onSendComment} />,
        );
        fireEvent.press(sendButton());
        expect(onSendComment).toHaveBeenCalledTimes(1);
    });

    it("repassa a digitação e exibe erro de envio", () => {
        const onChangeComment = jest.fn();
        render(
            <AccidentComments
                {...baseProps}
                onChangeComment={onChangeComment}
                commentError="Não enviado"
            />,
        );

        fireEvent.changeText(screen.getByLabelText(tr("accident.addComment")), "Oi");

        expect(onChangeComment).toHaveBeenCalledWith("Oi");
        expect(screen.getByRole("alert")).toHaveTextContent("Não enviado");
    });

    it("convida a verificar o e-mail em vez de exibir o campo", () => {
        const onVerifyEmail = jest.fn();
        render(
            <AccidentComments
                {...baseProps}
                isEmailVerified={false}
                onVerifyEmail={onVerifyEmail}
            />,
        );

        expect(screen.queryByLabelText(tr("accident.addComment"))).toBeNull();
        fireEvent.press(screen.getByLabelText(tr("accident.verifyToComment")));
        expect(onVerifyEmail).toHaveBeenCalled();
    });
});

describe("controles e avisos do mapa", () => {
    it("alterna entre pinos e mapa de calor", () => {
        const onShowMarkers = jest.fn();
        const onShowHeatmap = jest.fn();
        render(
            <MapViewModeToggle
                viewMode="heatmap"
                onShowMarkers={onShowMarkers}
                onShowHeatmap={onShowHeatmap}
            />,
        );

        expect(screen.getByLabelText(tr("map.showHeatmap"))).toBeSelected();
        expect(screen.getByLabelText(tr("map.showMarkers"))).not.toBeSelected();
        fireEvent.press(screen.getByLabelText(tr("map.showMarkers")));
        expect(onShowMarkers).toHaveBeenCalled();
    });

    it("exibe carregamento, estado vazio e erro com nova tentativa", () => {
        const onRetry = jest.fn();
        render(
            <>
                <MapLoadingOverlay />
                <MapEmptyOverlay />
                <MapErrorOverlay message="Sem conexão" onRetry={onRetry} />
            </>,
        );

        expect(screen.getByLabelText(tr("map.loadingAccidents"))).toBeTruthy();
        expect(screen.getByText(tr("map.noAccidents"))).toBeTruthy();
        fireEvent.press(screen.getByText(tr("common.retry")));
        expect(onRetry).toHaveBeenCalled();
    });
});
