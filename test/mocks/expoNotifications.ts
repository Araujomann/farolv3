/**
 * Substituto do `expo-notifications`, que depende de módulos nativos
 * (FCM/canais do Android) inexistentes no Node. Expõe apenas o que o app
 * usa. `__emitReceived` simula a chegada de uma notificação com o app aberto
 * e `__setLastResponse` simula o toque do usuário numa notificação.
 */
type Listener = (notification: unknown) => void;

const receivedListeners = new Set<Listener>();
let lastResponse: unknown = null;
const responseSubscribers = new Set<() => void>();

export const DEFAULT_ACTION_IDENTIFIER = "expo.modules.notifications.actions.DEFAULT";

export const AndroidImportance = { HIGH: 4, DEFAULT: 3 };

export const setNotificationHandler = jest.fn();
export const setNotificationChannelAsync = jest.fn(async () => null);
export const getPermissionsAsync = jest.fn(async () => ({ granted: true }));
export const requestPermissionsAsync = jest.fn(async () => ({ granted: true }));
export const getExpoPushTokenAsync = jest.fn(async () => ({
    type: "expo",
    data: "ExponentPushToken[test]",
}));

export const addNotificationReceivedListener = jest.fn((listener: Listener) => {
    receivedListeners.add(listener);
    return { remove: () => receivedListeners.delete(listener) };
});

export const clearLastNotificationResponse = jest.fn(() => {
    lastResponse = null;
});

export function useLastNotificationResponse() {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { useSyncExternalStore } = require("react");
    return useSyncExternalStore(
        (callback: () => void) => {
            responseSubscribers.add(callback);
            return () => responseSubscribers.delete(callback);
        },
        () => lastResponse,
    );
}

/** Notificação no formato de `Notifications.Notification`. */
export function makeNotification(
    data: Record<string, unknown>,
    identifier = "notification-1",
) {
    return {
        date: Date.now(),
        request: { identifier, content: { data }, trigger: null },
    };
}

export function __emitReceived(notification: unknown) {
    for (const listener of [...receivedListeners]) listener(notification);
}

export function __setLastResponse(response: unknown) {
    lastResponse = response;
    for (const callback of [...responseSubscribers]) callback();
}

export function __listenerCount() {
    return receivedListeners.size;
}

export function __reset() {
    receivedListeners.clear();
    lastResponse = null;
}
