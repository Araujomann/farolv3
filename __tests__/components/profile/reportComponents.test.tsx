/**
 * Componentes de "Meus relatos": cartão do relato (com endereço resolvido
 * via geocodificação SIMULADA), abas de status e estado vazio.
 */
import { fireEvent, render, screen } from "@testing-library/react-native";

import { EmptyReports } from "@/src/features/profile/components/reports/EmptyReports";
import { ReportCard } from "@/src/features/profile/components/reports/ReportCard";
import { ReportStatusTabs } from "@/src/features/profile/components/reports/ReportStatusTabs";
import { getStatusFilters } from "@/src/features/profile/constants/reportStatusFilters";
import * as geocoding from "@/src/features/map/services/reverseGeocode";
import { translate, tr } from "@/src/i18n";
import { lightColors } from "@/src/theme/colors";
import { makeReport } from "@/test/fixtures";
import { silenceConsole } from "@/test/utils/console";

jest.mock("@/src/features/map/services/reverseGeocode");
const reverseGeocode = jest.mocked(geocoding.reverseGeocode);

const filters = getStatusFilters(lightColors, (key) => translate("pt-BR", key));
const [approvedFilter, pendingFilter, rejectedFilter] = filters;

describe("ReportCard", () => {
    it("mostra tipo, status, data, coordenadas e o endereço resolvido", async () => {
        reverseGeocode.mockResolvedValue("Rua Ceará, Imperatriz");
        render(
            <ReportCard
                report={makeReport({ occurred_at: "2026-11-10T15:30:00.000Z" })}
                filter={approvedFilter}
            />,
        );

        expect(screen.getByText("ATROPELAMENTO")).toBeTruthy();
        expect(screen.getByLabelText(tr("reports.approved"))).toBeTruthy();
        expect(screen.getByText(/10 de nov\.?, 12:30/)).toBeTruthy();
        expect(screen.getByText(/-5\.5269, -47\.4781/)).toBeTruthy();
        expect(await screen.findByText("Rua Ceará, Imperatriz")).toBeTruthy();
    });

    it("indica endereço indisponível quando a geocodificação falha", async () => {
        silenceConsole();
        reverseGeocode.mockRejectedValue(new Error("offline"));
        render(<ReportCard report={makeReport()} filter={pendingFilter} />);

        expect(screen.getByText(tr("reports.searchingAddress"))).toBeTruthy();
        expect(await screen.findByText(tr("reports.addressUnavailable"))).toBeTruthy();
    });

    it("exibe o motivo da rejeição informado pela moderação", async () => {
        reverseGeocode.mockResolvedValue("Rua A");
        render(
            <ReportCard
                report={makeReport({
                    moderation_status: "REJECTED",
                    moderation_message: "  Local não confere  ",
                })}
                filter={rejectedFilter}
            />,
        );

        expect(screen.getByText(tr("reports.rejectionReason"))).toBeTruthy();
        expect(screen.getByText("Local não confere")).toBeTruthy();
        await screen.findByText("Rua A");
    });

    it("usa texto padrão quando a rejeição veio sem motivo", async () => {
        reverseGeocode.mockResolvedValue("Rua A");
        render(
            <ReportCard
                report={makeReport({ moderation_status: "REJECTED", moderation_message: "  " })}
                filter={rejectedFilter}
            />,
        );

        expect(screen.getByText(tr("reports.noRejectionReason"))).toBeTruthy();
        await screen.findByText("Rua A");
    });

    it("não mostra motivo de rejeição para relatos aprovados", async () => {
        reverseGeocode.mockResolvedValue("Rua A");
        render(<ReportCard report={makeReport()} filter={approvedFilter} />);

        expect(screen.queryByText(tr("reports.rejectionReason"))).toBeNull();
        await screen.findByText("Rua A");
    });

    it("informa data indisponível quando a data é inválida", async () => {
        reverseGeocode.mockResolvedValue("Rua A");
        render(
            <ReportCard report={makeReport({ occurred_at: "?" })} filter={approvedFilter} />,
        );

        expect(screen.getByText(new RegExp(tr("reports.dateUnavailable")))).toBeTruthy();
        await screen.findByText("Rua A");
    });
});

describe("ReportStatusTabs", () => {
    it("marca a aba selecionada e informa a troca", () => {
        const onSelect = jest.fn();
        render(
            <ReportStatusTabs filters={filters} selectedStatus="PENDING" onSelect={onSelect} />,
        );

        const tabs = screen.getAllByRole("tab");
        expect(tabs.map((tab) => tab.props.accessibilityLabel)).toEqual([
            tr("reports.approved"),
            tr("reports.pending"),
            tr("reports.rejected"),
        ]);
        expect(screen.getByRole("tab", { name: tr("reports.pending") })).toBeSelected();

        fireEvent.press(screen.getByRole("tab", { name: tr("reports.rejected") }));
        expect(onSelect).toHaveBeenCalledWith("REJECTED");
    });
});

describe("EmptyReports", () => {
    it("nomeia o status sem relatos", () => {
        render(<EmptyReports filter={pendingFilter} />);

        expect(
            screen.getByText(
                tr("reports.emptyTitle", { status: tr("reports.pending").toLowerCase() }),
            ),
        ).toBeTruthy();
        expect(screen.getByText(tr("reports.emptyMessage"))).toBeTruthy();
    });
});
