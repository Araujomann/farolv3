/**
 * Substituto do `expo-router` para testes de telas isoladas.
 *
 * As telas são renderizadas fora da árvore de navegação real; este módulo
 * registra as chamadas de navegação para que os testes verifiquem o destino.
 * `useFocusEffect` executa o efeito ao montar e a limpeza ao desmontar,
 * como acontece com uma tela que ganha e perde o foco.
 *
 * Uso: jest.mock("expo-router", () => require("@/test/mocks/expoRouter"));
 */
import { useEffect } from "react";

export const router = {
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    navigate: jest.fn(),
    dismissTo: jest.fn(),
    canGoBack: jest.fn(() => true),
};

export const navigation = {
    dispatch: jest.fn(),
    addListener: jest.fn(() => jest.fn()),
};

let params: Record<string, string | string[] | undefined> = {};
let segments: string[] = [];
let rootNavigationKey: string | undefined = "root";

export function __setParams(
    next: Record<string, string | string[] | undefined>,
) {
    params = next;
}

export function __setSegments(next: string[]) {
    segments = next;
}

export function __setRootNavigationKey(key: string | undefined) {
    rootNavigationKey = key;
}

export function __reset() {
    params = {};
    segments = [];
    rootNavigationKey = "root";
}

export const useRouter = () => router;
export const useLocalSearchParams = () => params;
export const useSegments = () => segments;
export const useRootNavigationState = () => ({ key: rootNavigationKey });
export const useNavigation = () => navigation;

export function useFocusEffect(effect: () => void | (() => void)) {
    useEffect(() => effect(), [effect]);
}

function StackScreen() {
    return null;
}

export function Stack() {
    return null;
}
Stack.Screen = StackScreen;

export function Redirect() {
    return null;
}
