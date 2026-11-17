import {
    getGamificationLevel,
    getLevelProgress,
} from "@/src/features/profile/constants/levels";

describe("getGamificationLevel", () => {
    it.each([
        [0, "user"],
        [1, "user"],
        [2, "guardian"],
        [3, "guardian"],
        [4, "chief-guard"],
        [5, "chief-guard"],
        [6, "chancellor"],
        [50, "chancellor"],
    ])("%i relatos aprovados → nível %s", (count, expected) => {
        expect(getGamificationLevel(count).id).toBe(expected);
    });

    it("trata contagem negativa como o nível inicial", () => {
        expect(getGamificationLevel(-3).id).toBe("user");
    });
});

describe("getLevelProgress", () => {
    it("calcula o percentual até o próximo nível", () => {
        const progress = getLevelProgress(1);

        expect(progress.level.id).toBe("user");
        expect(progress.nextLevel?.id).toBe("guardian");
        expect(progress.progressPercent).toBe(50);
    });

    it("mede o progresso desde zero, não desde o início do nível atual", () => {
        // 3 aprovados: nível guardião, próximo exige 4 → 75%.
        expect(getLevelProgress(3).progressPercent).toBe(75);
    });

    it("fica em 100% no último nível, sem próximo nível", () => {
        const progress = getLevelProgress(9);

        expect(progress.level.id).toBe("chancellor");
        expect(progress.nextLevel).toBeUndefined();
        expect(progress.progressPercent).toBe(100);
    });

    it("trata contagem ainda não carregada (null) como 100%", () => {
        const progress = getLevelProgress(null);

        expect(progress.level.id).toBe("user");
        expect(progress.progressPercent).toBe(100);
    });
});
