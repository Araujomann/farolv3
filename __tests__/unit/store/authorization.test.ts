import { hasRole, isModerator } from "@/src/store/authorization";
import { needsTermsAcceptance, TERMS_VERSION } from "@/src/features/legal/legalConfig";

describe("hasRole (hierarquia user < moderator < admin)", () => {
    it.each([
        ["user", "user", true],
        ["user", "moderator", false],
        ["user", "admin", false],
        ["moderator", "user", true],
        ["moderator", "moderator", true],
        ["moderator", "admin", false],
        ["admin", "user", true],
        ["admin", "moderator", true],
        ["admin", "admin", true],
    ] as const)("papel %s atende a %s → %s", (userRole, required, expected) => {
        expect(hasRole(userRole, required)).toBe(expected);
    });

    it("nega acesso quando não há usuário", () => {
        expect(hasRole(undefined, "user")).toBe(false);
    });
});

describe("isModerator", () => {
    it("considera moderadores e administradores", () => {
        expect(isModerator("moderator")).toBe(true);
        expect(isModerator("admin")).toBe(true);
        expect(isModerator("user")).toBe(false);
        expect(isModerator(undefined)).toBe(false);
    });
});

describe("needsTermsAcceptance", () => {
    it("não exige aceite de quem aceitou a versão atual", () => {
        expect(needsTermsAcceptance({ terms_version: TERMS_VERSION })).toBe(false);
    });

    it("exige aceite de quem nunca aceitou ou aceitou outra versão", () => {
        expect(needsTermsAcceptance({ terms_version: null })).toBe(true);
        expect(needsTermsAcceptance({ terms_version: "2025-01-01" })).toBe(true);
    });
});
