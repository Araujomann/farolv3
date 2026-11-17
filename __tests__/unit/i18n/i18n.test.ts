import {
    formatDateTime,
    formatNumber,
    formatRelativeTime,
    resolveLanguage,
    translate,
    translateAccidentType,
    tr,
    useLanguageStore,
} from "@/src/i18n";
import en from "@/src/i18n/locales/en";
import es from "@/src/i18n/locales/es";
import ptBR from "@/src/i18n/locales/pt-BR";

describe("translate", () => {
    it("traduz a chave no idioma pedido", () => {
        expect(translate("pt-BR", "tabs.home")).toBe("Início");
        expect(translate("en", "tabs.home")).toBe("Home");
    });

    it("interpola parâmetros {{nome}}", () => {
        expect(translate("pt-BR", "legal.version", { date: "15/11" })).toBe(
            "Versão de 15/11",
        );
    });

    it("mantém o marcador quando o parâmetro não é informado", () => {
        expect(translate("pt-BR", "legal.version", {})).toBe("Versão de {{date}}");
    });

    it("escolhe singular ou plural pela contagem", () => {
        expect(translate("pt-BR", "time.daysAgo", { count: 1 })).toBe("Há 1 dia");
        expect(translate("pt-BR", "time.daysAgo", { count: 3 })).toBe("Há 3 dias");
        expect(translate("pt-BR", "time.daysAgo", { count: 0 })).toBe("Há 0 dias");
    });

    it("devolve a própria chave quando ela não existe em nenhum idioma", () => {
        expect(translate("en", "nao.existe" as never)).toBe("nao.existe");
    });
});

describe("tr e preferência de idioma", () => {
    it("usa o idioma escolhido na store", () => {
        useLanguageStore.setState({ preference: "es" });
        expect(tr("tabs.map")).toBe(es.tabs.map);
    });

    it("resolve 'system' para um idioma suportado", () => {
        expect(["pt-BR", "en", "es"]).toContain(resolveLanguage("system"));
        expect(resolveLanguage("en")).toBe("en");
    });
});

describe("dicionários", () => {
    type Node = string | { [key: string]: Node };

    const flatten = (node: Node, prefix = ""): Record<string, string> =>
        typeof node === "string"
            ? { [prefix]: node }
            : Object.entries(node).reduce<Record<string, string>>(
                  (acc, [key, value]) => ({
                      ...acc,
                      ...flatten(value, prefix ? `${prefix}.${key}` : key),
                  }),
                  {},
              );

    const placeholders = (text: string) =>
        [...text.matchAll(/\{\{(\w+)\}\}/g)].map((match) => match[1]).sort();

    const reference = flatten(ptBR as unknown as Node);

    it.each([
        ["en", en],
        ["es", es],
    ])("%s usa os mesmos parâmetros de interpolação que pt-BR", (_name, dictionary) => {
        const translated = flatten(dictionary as unknown as Node);
        const mismatches = Object.entries(reference)
            .filter(
                ([key, text]) =>
                    JSON.stringify(placeholders(text)) !==
                    JSON.stringify(placeholders(translated[key] ?? "")),
            )
            .map(([key]) => key);

        expect(mismatches).toEqual([]);
    });

    it.each([
        ["en", en],
        ["es", es],
    ])("%s não tem textos vazios", (_name, dictionary) => {
        const empty = Object.entries(flatten(dictionary as unknown as Node))
            .filter(([, text]) => text.trim() === "")
            .map(([key]) => key);

        expect(empty).toEqual([]);
    });
});

describe("formatRelativeTime", () => {
    const now = new Date("2026-11-16T12:00:00.000Z");

    beforeEach(() => {
        jest.useFakeTimers({ now });
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    const ago = (ms: number) => new Date(now.getTime() - ms).toISOString();

    it.each([
        [ago(30_000), "Agora"],
        [ago(60_000), "Agora"],
        [ago(5 * 60_000), "Há 5 min"],
        [ago(59 * 60_000), "Há 59 min"],
        [ago(60 * 60_000), "Há 1 h"],
        [ago(23 * 60 * 60_000), "Há 23 h"],
        [ago(24 * 60 * 60_000), "Há 1 dia"],
        [ago(3 * 24 * 60 * 60_000), "Há 3 dias"],
    ])("%s → %s", (value, expected) => {
        expect(formatRelativeTime(value)).toBe(expected);
    });

    it("trata datas futuras (relógio adiantado) como 'Agora'", () => {
        expect(formatRelativeTime(ago(-10 * 60_000))).toBe("Agora");
    });

    it("informa quando a data é inválida", () => {
        expect(formatRelativeTime("data-invalida")).toBe("Data indisponível");
    });
});

describe("formatação", () => {
    it("formata data e hora curtas no idioma", () => {
        expect(formatDateTime("2026-11-16T17:30:00.000Z", "pt-BR")).toBe(
            "16/11/2026, 14:30",
        );
    });

    it("informa quando a data não é válida", () => {
        expect(formatDateTime("sem data", "pt-BR")).toBe("Data não informada");
    });

    it("formata números com o separador do idioma", () => {
        expect(formatNumber(1234567, "pt-BR")).toBe("1.234.567");
        expect(formatNumber(1234567, "en")).toBe("1,234,567");
    });

    it("traduz só os tipos de acidente definidos pelo app", () => {
        useLanguageStore.setState({ preference: "en" });

        expect(translateAccidentType("COLISÃO")).toBe("Collision");
        // Tipos livres (como os da PRF) são exibidos como vieram.
        expect(translateAccidentType("Saída de leito carroçável")).toBe(
            "Saída de leito carroçável",
        );
    });
});
