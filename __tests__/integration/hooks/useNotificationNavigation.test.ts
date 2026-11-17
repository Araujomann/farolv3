/**
 * Toque na notificação de acidente aprovado → abre o mapa no acidente.
 * `expo-notifications` e a navegação são SIMULADOS.
 */
import { act, renderHook } from "@testing-library/react-native";
import * as Notifications from "expo-notifications";

import { useNotificationNavigation } from "@/src/features/notifications/useNotificationNavigation";
import { router } from "@/test/mocks/expoRouter";
import {
    __setLastResponse,
    DEFAULT_ACTION_IDENTIFIER,
    makeNotification,
} from "@/test/mocks/expoNotifications";

jest.mock("expo-router", () => require("@/test/mocks/expoRouter"));

const tapResponse = (
    data: Record<string, unknown>,
    identifier = "n-1",
    actionIdentifier = DEFAULT_ACTION_IDENTIFIER,
) => ({
    actionIdentifier,
    notification: makeNotification(data, identifier),
});

const approved = { type: "ACCIDENT_APPROVED", accidentId: "acc-7" };

beforeEach(() => {
    jest.useFakeTimers({ now: new Date("2026-11-16T12:00:00.000Z") });
});

afterEach(() => {
    jest.useRealTimers();
});

it("abre o mapa centralizado no acidente aprovado", () => {
    renderHook(() => useNotificationNavigation(true));

    act(() => __setLastResponse(tapResponse(approved)));

    expect(router.navigate).toHaveBeenCalledWith({
        pathname: "/map",
        params: {
            focusAccidentId: "acc-7",
            focusRequest: String(Date.parse("2026-11-16T12:00:00.000Z")),
        },
    });
    expect(Notifications.clearLastNotificationResponse).toHaveBeenCalled();
});

it("guarda o toque até o usuário estar na área logada", () => {
    act(() => __setLastResponse(tapResponse(approved)));
    const { rerender } = renderHook(
        ({ canNavigate }: { canNavigate: boolean }) =>
            useNotificationNavigation(canNavigate),
        { initialProps: { canNavigate: false } },
    );
    expect(router.navigate).not.toHaveBeenCalled();

    rerender({ canNavigate: true });

    expect(router.navigate).toHaveBeenCalledTimes(1);
});

it("não reabre o mapa para o mesmo toque", () => {
    const response = tapResponse(approved);
    const { rerender } = renderHook(
        ({ canNavigate }: { canNavigate: boolean }) =>
            useNotificationNavigation(canNavigate),
        { initialProps: { canNavigate: true } },
    );
    act(() => __setLastResponse(response));

    rerender({ canNavigate: false });
    act(() => __setLastResponse(response));
    rerender({ canNavigate: true });

    expect(router.navigate).toHaveBeenCalledTimes(1);
});

it.each([
    ["outro tipo de notificação", tapResponse({ type: "ADMIN_NOTICE" }, "n-2")],
    [
        "ação diferente do toque principal",
        tapResponse(approved, "n-3", "dismiss"),
    ],
])("ignora %s", (_label, response) => {
    renderHook(() => useNotificationNavigation(true));

    act(() => __setLastResponse(response));

    expect(router.navigate).not.toHaveBeenCalled();
});
