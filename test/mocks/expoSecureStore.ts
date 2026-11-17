/**
 * Substituto em memória do `expo-secure-store`. O módulo real grava no
 * Keystore do Android, indisponível no Node. Os testes inspecionam o
 * conteúdo com `__getStore()` e o estado é limpo antes de cada teste.
 */
const store = new Map<string, string>();

export const getItemAsync = jest.fn(async (key: string) =>
    store.has(key) ? (store.get(key) as string) : null,
);

export const setItemAsync = jest.fn(async (key: string, value: string) => {
    store.set(key, value);
});

export const deleteItemAsync = jest.fn(async (key: string) => {
    store.delete(key);
});

export function __getStore(): Record<string, string> {
    return Object.fromEntries(store);
}

export function __reset(initial: Record<string, string> = {}) {
    store.clear();
    for (const [key, value] of Object.entries(initial)) store.set(key, value);
}
