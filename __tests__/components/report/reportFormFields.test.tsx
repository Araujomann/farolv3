/**
 * Campos do formulário de relato, renderizados isoladamente.
 */
import { createRef } from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";
import type { TextInput } from "react-native";

import { AccidentTypeSelector } from "@/src/features/report/components/form/AccidentTypeSelector";
import { DateTimeCard } from "@/src/features/report/components/form/DateTimeCard";
import { ExitReportDialog } from "@/src/features/report/components/form/ExitReportDialog";
import { LocationCard } from "@/src/features/report/components/form/LocationCard";
import { ReportSubmitButton } from "@/src/features/report/components/form/ReportSubmitButton";
import { SeveritySelector } from "@/src/features/report/components/form/SeveritySelector";
import { tr } from "@/src/i18n";

describe("DateTimeCard", () => {
    it("mostra o dia do relato e aplica a máscara HH:MM no horário", () => {
        const onChangeTime = jest.fn();
        render(
            <DateTimeCard
                reportDate={new Date(2026, 10, 16)}
                time=""
                onChangeTime={onChangeTime}
            />,
        );

        expect(screen.getByText("16/11/2026")).toBeTruthy();
        fireEvent.changeText(screen.getByLabelText(tr("report.form.timeLabel")), "0930");

        expect(onChangeTime).toHaveBeenCalledWith("09:30");
    });
});

describe("AccidentTypeSelector", () => {
    const renderSelector = (
        accidentType: "COLISÃO" | "ATROPELAMENTO" | "OUTRO" | null,
        onSelectAccidentType = jest.fn(),
    ) =>
        render(
            <AccidentTypeSelector
                accidentType={accidentType}
                onSelectAccidentType={onSelectAccidentType}
                customType=""
                onChangeCustomType={jest.fn()}
                isCustomTypeFocused={false}
                onCustomTypeFocusChange={jest.fn()}
                customTypeInputRef={createRef<TextInput>()}
            />,
        );

    it("oferece os três tipos e marca o selecionado", () => {
        renderSelector("ATROPELAMENTO");

        const options = screen.getAllByRole("radio");
        expect(options).toHaveLength(3);
        expect(
            options.map((option) => option.props.accessibilityState.selected),
        ).toEqual([false, true, false]);
    });

    it("informa o tipo escolhido", () => {
        const onSelect = jest.fn();
        renderSelector(null, onSelect);

        fireEvent.press(screen.getByText("COLISÃO"));

        expect(onSelect).toHaveBeenCalledWith("COLISÃO");
    });

    it("só pede o tipo livre quando 'Outro' está selecionado", () => {
        renderSelector("COLISÃO");
        expect(screen.queryByText(tr("report.form.customTypeQuestion"))).toBeNull();

        renderSelector("OUTRO");
        expect(screen.getByText(tr("report.form.customTypeQuestion"))).toBeTruthy();
        expect(
            screen.getByPlaceholderText(tr("report.form.customTypePlaceholder")).props
                .maxLength,
        ).toBe(60);
    });
});

describe("SeveritySelector", () => {
    it("lista as quatro gravidades e informa a escolhida", () => {
        const onSelect = jest.fn();
        render(<SeveritySelector severity="high" onSelect={onSelect} />);

        expect(screen.getAllByRole("radio")).toHaveLength(4);
        fireEvent.press(screen.getByText(tr("enums.severity.critical")));

        expect(onSelect).toHaveBeenCalledWith("critical");
        expect(
            screen
                .getAllByRole("radio")
                .map((option) => option.props.accessibilityState.selected),
        ).toEqual([false, false, true, false]);
    });
});

describe("ReportSubmitButton", () => {
    it("envia ao tocar", () => {
        const onPress = jest.fn();
        render(<ReportSubmitButton isSubmitting={false} onPress={onPress} />);

        fireEvent.press(screen.getByRole("button", { name: tr("report.form.submitLabel") }));

        expect(onPress).toHaveBeenCalled();
    });

    it("bloqueia novos toques durante o envio", () => {
        const onPress = jest.fn();
        render(<ReportSubmitButton isSubmitting onPress={onPress} />);

        const button = screen.getByRole("button", { name: tr("report.form.submitLabel") });
        fireEvent.press(button);

        expect(onPress).not.toHaveBeenCalled();
        expect(button).toBeDisabled();
        expect(screen.queryByText(tr("report.form.submit").toUpperCase())).toBeNull();
    });
});

describe("ExitReportDialog", () => {
    it("permite continuar preenchendo ou sair", () => {
        const onClose = jest.fn();
        const onConfirmExit = jest.fn();
        render(
            <ExitReportDialog visible onClose={onClose} onConfirmExit={onConfirmExit} />,
        );

        fireEvent.press(screen.getByLabelText(tr("report.form.keepFillingLabel")));
        expect(onClose).toHaveBeenCalledTimes(1);

        fireEvent.press(screen.getByLabelText(tr("report.form.leave")));
        expect(onConfirmExit).toHaveBeenCalledTimes(1);
    });

    it("não aparece quando oculto", () => {
        render(
            <ExitReportDialog visible={false} onClose={jest.fn()} onConfirmExit={jest.fn()} />,
        );

        expect(screen.queryByText(tr("report.form.leaveTitle"))).toBeNull();
    });
});

describe("LocationCard", () => {
    const baseProps = {
        isLoadingAddress: false,
        address: "Rua Ceará, Imperatriz",
        addressError: null,
        hasLocation: true,
        latitude: -5.526931,
        longitude: -47.478123,
    };

    it("mostra o endereço e as coordenadas com 6 casas", () => {
        render(<LocationCard {...baseProps} />);

        expect(screen.getByText("Rua Ceará, Imperatriz")).toBeTruthy();
        expect(screen.getByText("-5.526931, -47.478123")).toBeTruthy();
    });

    it("indica a busca do endereço em andamento", () => {
        render(<LocationCard {...baseProps} isLoadingAddress />);

        expect(screen.getByText(tr("report.form.searchingAddress"))).toBeTruthy();
    });

    it("prioriza a mensagem de erro sobre o endereço", () => {
        render(<LocationCard {...baseProps} addressError="Sem endereço" />);

        expect(screen.getByText("Sem endereço")).toBeTruthy();
        expect(screen.queryByText("Rua Ceará, Imperatriz")).toBeNull();
    });

    it("avisa quando as coordenadas não estão disponíveis", () => {
        render(<LocationCard {...baseProps} hasLocation={false} />);

        expect(screen.getByText(tr("report.form.coordinatesUnavailable"))).toBeTruthy();
    });
});
