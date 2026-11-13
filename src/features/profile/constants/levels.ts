import { Badge, Shield, Sprout, Swords } from "lucide-react-native";

export const POINTS_PER_APPROVED_REPORT = 100;

export const LEVELS = [
    {
        id: "user",
        key: "user",
        minApprovedReports: 0,
        color: "#7A8494",
        icon: Sprout,
    },
    {
        id: "guardian",
        key: "guardian",
        minApprovedReports: 2,
        color: "#1769C2",
        icon: Shield,
    },
    {
        id: "chief-guard",
        key: "chiefGuard",
        minApprovedReports: 4,
        color: "#783DB5",
        icon: Swords,
    },
    {
        id: "chancellor",
        key: "chancellor",
        minApprovedReports: 6,
        color: "#84223D",
        icon: Badge,
    },
] as const;

export type GamificationLevel = (typeof LEVELS)[number];

export function getGamificationLevel(
    approvedReportsCount: number,
): GamificationLevel {
    return LEVELS.reduce<GamificationLevel>(
        (currentLevel, level) =>
            approvedReportsCount >= level.minApprovedReports
                ? level
                : currentLevel,
        LEVELS[0],
    );
}

/**
 * Nível atual, próximo nível e percentual de progresso até ele.
 * Sem contagem carregada (`null`), o progresso é tratado como 100%.
 */
export function getLevelProgress(approvedReportsCount: number | null) {
    const level = getGamificationLevel(approvedReportsCount ?? 0);
    const levelIndex = LEVELS.findIndex(
        (candidate) => candidate.id === level.id,
    );
    const nextLevel: GamificationLevel | undefined = LEVELS[levelIndex + 1];
    const progressPercent =
        approvedReportsCount === null || !nextLevel
            ? 100
            : Math.min(
                  100,
                  Math.max(
                      0,
                      (approvedReportsCount / nextLevel.minApprovedReports) * 100,
                  ),
              );

    return { level, nextLevel, progressPercent };
}
