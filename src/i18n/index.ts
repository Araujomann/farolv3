import * as SecureStore from "expo-secure-store";
import { useCallback } from "react";
import { create } from "zustand";

import en from "./locales/en";
import es from "./locales/es";
import ptBR, { type Dictionary } from "./locales/pt-BR";

export const SUPPORTED_LANGUAGES = ["pt-BR", "en", "es"] as const;
export type Language = (typeof SUPPORTED_LANGUAGES)[number];
export type LanguagePreference = "system" | Language;

const DICTIONARIES: Record<Language, Dictionary> = { "pt-BR": ptBR, en, es };

/** Nome de cada idioma escrito nele mesmo (padrão em seletores de idioma). */
export const LANGUAGE_NATIVE_NAMES: Record<Language, string> = {
    "pt-BR": "Português (Brasil)",
    en: "English",
    es: "Español",
};

const STORAGE_KEY = "language_preference";
const FALLBACK_LANGUAGE: Language = "pt-BR";

let cachedSystemLanguage: Language | null = null;

/**
 * Idioma do aparelho, reduzido a um dos idiomas suportados. Fica em cache:
 * criar um `Intl.DateTimeFormat` é caro no Hermes e esta função é chamada
 * em toda tradução/formatação feita fora de componentes.
 */
export function getSystemLanguage(): Language {
    if (cachedSystemLanguage) return cachedSystemLanguage;
    cachedSystemLanguage = detectSystemLanguage();
    return cachedSystemLanguage;
}

function detectSystemLanguage(): Language {
    let tag = "";
    try {
        tag = Intl.DateTimeFormat().resolvedOptions().locale ?? "";
    } catch {
        // Sem Intl: cai no idioma padrão.
    }
    const base = tag.toLowerCase().split("-")[0];
    if (base === "pt") return "pt-BR";
    if (base === "en") return "en";
    if (base === "es") return "es";
    return FALLBACK_LANGUAGE;
}

function isLanguagePreference(value: unknown): value is LanguagePreference {
    return (
        value === "system" ||
        (SUPPORTED_LANGUAGES as readonly unknown[]).includes(value)
    );
}

type LanguageState = {
    preference: LanguagePreference;
    isHydrated: boolean;
    hydrate: () => Promise<void>;
    setPreference: (preference: LanguagePreference) => void;
};

export const useLanguageStore = create<LanguageState>((set) => ({
    preference: "system",
    isHydrated: false,

    hydrate: async () => {
        try {
            const stored = await SecureStore.getItemAsync(STORAGE_KEY);
            set({
                preference: isLanguagePreference(stored) ? stored : "system",
                isHydrated: true,
            });
        } catch {
            set({ isHydrated: true });
        }
    },

    setPreference: (preference) => {
        set({ preference });
        SecureStore.setItemAsync(STORAGE_KEY, preference).catch((error) => {
            if (__DEV__) {
                console.warn("Falha ao salvar o idioma", error);
            }
        });
    },
}));

export function resolveLanguage(preference: LanguagePreference): Language {
    return preference === "system" ? getSystemLanguage() : preference;
}

/**
 * Idioma em uso, para código fora de componentes (formatação de datas e
 * números). Componentes que exibem o resultado devem usar `useTranslation`
 * para re-renderizar quando o idioma mudar.
 */
export function getCurrentLanguage(): Language {
    return resolveLanguage(useLanguageStore.getState().preference);
}

/* ── Tradução ────────────────────────────────────────────────── */

type Leaves<T, P extends string = ""> = {
    [K in keyof T & string]: T[K] extends string
        ? `${P}${K}`
        : Leaves<T[K], `${P}${K}.`>;
}[keyof T & string];

type StripPlural<K extends string> = K extends `${infer B}_one`
    ? B
    : K extends `${infer B}_other`
      ? B
      : K;

export type TranslationKey = StripPlural<Leaves<Dictionary>>;
export type TranslationParams = Record<string, string | number>;

function lookup(dictionary: Dictionary, key: string): string | undefined {
    let node: unknown = dictionary;
    for (const part of key.split(".")) {
        if (node === null || typeof node !== "object") return undefined;
        node = (node as Record<string, unknown>)[part];
    }
    return typeof node === "string" ? node : undefined;
}

export function translate(
    language: Language,
    key: TranslationKey,
    params?: TranslationParams,
): string {
    const dictionary = DICTIONARIES[language];
    let resolvedKey: string = key;

    if (typeof params?.count === "number") {
        // pt, en e es compartilham a regra "1 → singular, demais → plural".
        const pluralKey = `${key}_${params.count === 1 ? "one" : "other"}`;
        if (lookup(dictionary, pluralKey) ?? lookup(ptBR, pluralKey)) {
            resolvedKey = pluralKey;
        }
    }

    const template =
        lookup(dictionary, resolvedKey) ?? lookup(ptBR, resolvedKey) ?? key;

    return params
        ? template.replace(/\{\{(\w+)\}\}/g, (match, name: string) =>
              name in params ? String(params[name]) : match,
          )
        : template;
}

/** Tradução fora de componentes, no idioma em uso. */
export function tr(key: TranslationKey, params?: TranslationParams): string {
    return translate(getCurrentLanguage(), key, params);
}

/* ── Formatadores em cache ───────────────────────────────────── */

// Construir formatadores `Intl` é caro (principalmente no Hermes). Como as
// opções usadas no app são poucas e fixas, cada combinação idioma + opções
// é criada uma única vez e reutilizada.
const dateTimeFormatters = new Map<string, Intl.DateTimeFormat>();
const numberFormatters = new Map<string, Intl.NumberFormat>();

export function getDateTimeFormatter(
    language: Language,
    options: Intl.DateTimeFormatOptions,
): Intl.DateTimeFormat {
    const key = `${language}|${JSON.stringify(options)}`;
    let formatter = dateTimeFormatters.get(key);
    if (!formatter) {
        formatter = new Intl.DateTimeFormat(language, options);
        dateTimeFormatters.set(key, formatter);
    }
    return formatter;
}

/** Número formatado no idioma informado (ou no idioma em uso). */
export function formatNumber(
    value: number,
    language: Language = getCurrentLanguage(),
): string {
    let formatter = numberFormatters.get(language);
    if (!formatter) {
        formatter = new Intl.NumberFormat(language);
        numberFormatters.set(language, formatter);
    }
    return formatter.format(value);
}

const SHORT_DATE_TIME: Intl.DateTimeFormatOptions = {
    dateStyle: "short",
    timeStyle: "short",
};

/** Data e hora curtas no idioma em uso (ex.: 12/11/2026 14:30). */
export function formatDateTime(
    value: string | Date,
    language: Language = getCurrentLanguage(),
): string {
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return tr("time.dateNotInformed");

    return getDateTimeFormatter(language, SHORT_DATE_TIME).format(date);
}

/**
 * Traduz os tipos de acidente definidos pelo app (COLISÃO, ATROPELAMENTO,
 * OUTRO). Tipos livres — como os da PRF — são exibidos como vieram.
 */
export function translateAccidentType(value: string): string {
    const types = DICTIONARIES[getCurrentLanguage()].enums.accidentType;
    return value in types ? types[value as keyof typeof types] : value;
}

/** "Agora", "Há 5 min", "Há 2 dias"... a partir de uma data ISO. */
export function formatRelativeTime(value: string): string {
    const timestamp = new Date(value).getTime();
    if (!Number.isFinite(timestamp)) return tr("time.dateUnavailable");

    const minutes = Math.max(0, Math.floor((Date.now() - timestamp) / 60_000));
    if (minutes < 60) {
        return minutes <= 1 ? tr("time.now") : tr("time.minutesAgo", { count: minutes });
    }

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return tr("time.hoursAgo", { count: hours });

    return tr("time.daysAgo", { count: Math.floor(hours / 24) });
}

/** Hook de tradução: re-renderiza o componente quando o idioma muda. */
export function useTranslation() {
    const preference = useLanguageStore((state) => state.preference);
    const language = resolveLanguage(preference);

    const t = useCallback(
        (key: TranslationKey, params?: TranslationParams) =>
            translate(language, key, params),
        [language],
    );

    return { t, language };
}
