import { Check, Clock3, X, type LucideIcon } from "lucide-react-native";

import type { ReportStatus } from "@/src/api/reports";
import type { TranslationKey } from "@/src/i18n";
import { type AppColors } from "@/src/theme/colors";

export type StatusFilter = {
    status: ReportStatus;
    label: string;
    icon: LucideIcon;
    color: string;
    background: string;
};

/** Abas de status de "Meus relatos", com ícone e cores de cada status. */
export const getStatusFilters = (
    colors: AppColors,
    t: (key: TranslationKey) => string,
): StatusFilter[] => [
    {
        status: "APPROVED",
        label: t("reports.approved"),
        icon: Check,
        color: colors.success,
        background: colors.successContainer,
    },
    {
        status: "PENDING",
        label: t("reports.pending"),
        icon: Clock3,
        color: colors.warning,
        background: colors.warningContainer,
    },
    {
        status: "REJECTED",
        label: t("reports.rejected"),
        icon: X,
        color: colors.error,
        background: colors.errorContainer,
    },
];
