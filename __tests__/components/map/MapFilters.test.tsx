/**
 * Painel de filtros do mapa: rascunho, aplicação, limpeza e contador.
 */
import { fireEvent, render, screen } from "@testing-library/react-native";

import { MapFilters } from "@/src/features/map/components/MapFilters";
import type { AccidentMapFilters } from "@/src/features/map/types/accident.types";
import { tr } from "@/src/i18n";

const setup = (filters: AccidentMapFilters = {}) => {
    const onApply = jest.fn();
    const onClear = jest.fn();
    const utils = render(
        <MapFilters
            filters={filters}
            onApply={onApply}
            onClear={onClear}
            onInteraction={jest.fn()}
        />,
    );
    const open = () => fireEvent.press(screen.getByText(tr("filters.title")));
    return { ...utils, onApply, onClear, open };
};

beforeEach(() => {
    jest.useFakeTimers({ now: new Date(2026, 10, 16, 10, 0) });
});

afterEach(() => {
    jest.useRealTimers();
});

it("começa fechado e sem contador quando não há filtros", () => {
    setup();

    expect(screen.getByText(tr("filters.title"))).toBeTruthy();
    expect(screen.queryByText(tr("filters.apply"))).toBeNull();
    expect(screen.queryByText("1")).toBeNull();
});

it("conta os filtros ativos, contando o período (from/to) uma vez", () => {
    setup({
        severity: "high",
        source: "PRF",
        from: "2026-08-16T13:00:00.000Z",
        to: "2026-11-16T13:00:00.000Z",
    });

    expect(screen.getByText("3")).toBeTruthy();
});

it("aplica somente os filtros escolhidos no rascunho", () => {
    const { open, onApply } = setup();
    open();

    fireEvent.press(screen.getByText(tr("enums.severity.critical")));
    fireEvent.press(screen.getByText(tr("enums.classification.com_vitima")));
    fireEvent.press(screen.getByText(tr("enums.source.APP")));
    fireEvent.press(screen.getByText(tr("filters.apply")));

    expect(onApply).toHaveBeenCalledWith({
        severity: "critical",
        classificacao: "com_vitima",
        source: "APP",
    });
    expect(screen.queryByText(tr("filters.apply"))).toBeNull();
});

it("tocar de novo numa opção a desmarca", () => {
    const { open, onApply } = setup();
    open();

    fireEvent.press(screen.getByText(tr("enums.severity.low")));
    fireEvent.press(screen.getByText(tr("enums.severity.low")));
    fireEvent.press(screen.getByText(tr("filters.apply")));

    expect(onApply).toHaveBeenCalledWith({});
});

it("o período define o intervalo from/to a partir de agora", () => {
    const { open, onApply } = setup();
    open();

    fireEvent.press(screen.getByText(tr("filters.quarterly")));
    fireEvent.press(screen.getByText(tr("filters.apply")));

    expect(onApply).toHaveBeenCalledWith({
        from: new Date(2026, 7, 16, 10, 0).toISOString(),
        to: new Date(2026, 10, 16, 10, 0).toISOString(),
    });
});

it("fechar sem aplicar descarta o rascunho", () => {
    const { open, onApply } = setup({ severity: "medium" });
    open();
    fireEvent.press(screen.getByText(tr("enums.severity.high")));

    // O botão de fechar não tem rótulo acessível; é localizado pelo ícone X.
    fireEvent.press(screen.getByTestId("icon-X"));
    open();
    fireEvent.press(screen.getByText(tr("filters.apply")));

    expect(onApply).toHaveBeenCalledWith({ severity: "medium" });
});

it("limpar remove todos os filtros e fecha o painel", () => {
    const { open, onClear } = setup({ severity: "medium" });
    open();

    fireEvent.press(screen.getByText(tr("filters.clear")));

    expect(onClear).toHaveBeenCalled();
    expect(screen.queryByText(tr("filters.apply"))).toBeNull();
});
