import type { User } from "@/src/store/types";

/**
 * Versão dos Termos de Uso e da Política de Privacidade: a data de publicação
 * dos textos (AAAA-MM-DD). Ao alterar qualquer um dos textos, atualize esta
 * data: contas que aceitaram outra versão precisarão aceitar de novo.
 */
export const TERMS_VERSION = "2026-11-15";

/** Data da versão por extenso, para exibir no rodapé dos documentos. */
export const TERMS_VERSION_LABEL = "15 de novembro de 2026";

/**
 * Canal para o titular exercer seus direitos (LGPD art. 41). Definido no
 * build por `EXPO_PUBLIC_PRIVACY_CONTACT`; sem ele, os textos orientam a usar
 * as opções de exportação e exclusão do próprio aplicativo.
 */
export const PRIVACY_CONTACT =
    process.env.EXPO_PUBLIC_PRIVACY_CONTACT?.trim() || null;

/** A conta ainda não aceitou a versão atual dos textos. */
export function needsTermsAcceptance(user: Pick<User, "terms_version">) {
    return user.terms_version !== TERMS_VERSION;
}
