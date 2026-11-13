import { Activity, ArrowDownRight, ArrowUpRight } from "lucide-react-native";

import { useHomeColors } from "@/src/features/home/hooks/useHomeColors";
import { useTranslation } from "@/src/i18n";

/**
 * ATENÇÃO: componente incompleto (não retorna JSX) e não utilizado em
 * nenhuma tela. Foi movido sem alterações durante a refatoração da Home,
 * aguardando decisão sobre concluí-lo ou removê-lo.
 */
export function TrendCard({
    currentCount,
    previousCount,
}: {
    currentCount: number;
    previousCount: number;
}) {
    const { t } = useTranslation();
    const COLORS = useHomeColors();
    const change =
        previousCount === 0
            ? null
            : Math.round(
                  ((currentCount - previousCount) / previousCount) * 100,
              );
    const isIncrease = change !== null && change > 0;
    const isDecrease = change !== null && change < 0;
    const changeColor = isIncrease
        ? COLORS.negative
        : isDecrease
          ? COLORS.positive
          : COLORS.secondaryText;
    const changeBackground = isIncrease
        ? COLORS.negativeBackground
        : isDecrease
          ? COLORS.positiveBackground
          : COLORS.surfaceIcon;
    const TrendIcon = isIncrease
        ? ArrowUpRight
        : isDecrease
          ? ArrowDownRight
          : Activity;
    const changeLabel =
        change === null
            ? currentCount > 0
                ? t("home.newRecords")
                : t("home.noRecords")
            : `${change > 0 ? "+" : ""}${change}%`;

}
