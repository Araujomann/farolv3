/**
 * Registro e remoção do token de push, com `expo-notifications` e a API
 * SIMULADOS. Verifica a decisão de registrar, as permissões e o envio do
 * token à API.
 */
import * as Notifications from "expo-notifications";

import {
    isAccidentApprovedNotification,
    registerForPushNotifications,
    unregisterCurrentPushToken,
} from "@/src/features/notifications/pushNotifications";
import { __getStore, __reset } from "@/test/mocks/expoSecureStore";
import { makeNotification } from "@/test/mocks/expoNotifications";
import { installHttpMock } from "@/test/utils/installHttpMock";

let mockIsDevice = true;
jest.mock("expo-device", () => ({
    __esModule: true,
    get isDevice() {
        return mockIsDevice;
    },
}));

const http = installHttpMock();

beforeEach(() => {
    mockIsDevice = true;
    process.env.EXPO_PUBLIC_EAS_PROJECT_ID = "eas-project-test";
});

describe("isAccidentApprovedNotification", () => {
    it("reconhece o aviso de acidente aprovado com o ID do acidente", () => {
        const notification = makeNotification({
            type: "ACCIDENT_APPROVED",
            accidentId: "acc-1",
        });
        expect(
            isAccidentApprovedNotification(notification as never),
        ).toBe(true);
    });

    it.each([
        [{ type: "ACCIDENT_APPROVED" }],
        [{ type: "ACCIDENT_APPROVED", accidentId: 42 }],
        [{ type: "ADMIN_NOTICE", accidentId: "acc-1" }],
        [{}],
    ])("ignora outras notificações %p", (data) => {
        expect(
            isAccidentApprovedNotification(makeNotification(data) as never),
        ).toBe(false);
    });
});

describe("registerForPushNotifications", () => {
    it("registra o token do aparelho na API e o guarda localmente", async () => {
        http.on("PUT", "/notifications/push-token", { status: 204 });

        await registerForPushNotifications();

        expect(Notifications.setNotificationChannelAsync).toHaveBeenCalledWith(
            "default",
            expect.objectContaining({ name: "Notificações" }),
        );
        expect(Notifications.getExpoPushTokenAsync).toHaveBeenCalledWith({
            projectId: "eas-project-test",
        });
        const [call] = http.callsTo("PUT", "/notifications/push-token");
        expect(JSON.parse(call.data)).toEqual({
            token: "ExponentPushToken[test]",
            platform: "android",
        });
        expect(__getStore()).toEqual({ expo_push_token: "ExponentPushToken[test]" });
    });

    it("pede permissão quando ainda não foi concedida", async () => {
        jest.mocked(Notifications.getPermissionsAsync).mockResolvedValueOnce({
            granted: false,
        } as never);
        http.on("PUT", "/notifications/push-token", { status: 204 });

        await registerForPushNotifications();

        expect(Notifications.requestPermissionsAsync).toHaveBeenCalled();
        expect(http.calls).toHaveLength(1);
    });

    it("não registra quando o usuário nega a permissão", async () => {
        jest.mocked(Notifications.getPermissionsAsync).mockResolvedValueOnce({
            granted: false,
        } as never);
        jest.mocked(Notifications.requestPermissionsAsync).mockResolvedValueOnce({
            granted: false,
        } as never);

        await registerForPushNotifications();

        expect(Notifications.getExpoPushTokenAsync).not.toHaveBeenCalled();
        expect(http.calls).toHaveLength(0);
    });

    it("não faz nada em emuladores (sem aparelho físico)", async () => {
        mockIsDevice = false;

        await registerForPushNotifications();

        expect(Notifications.getPermissionsAsync).not.toHaveBeenCalled();
        expect(http.calls).toHaveLength(0);
    });
});

describe("unregisterCurrentPushToken", () => {
    it("remove o token na API e no aparelho", async () => {
        __reset({ expo_push_token: "ExponentPushToken[abc]" });
        http.on("DELETE", "/notifications/push-token", { status: 204 });

        await unregisterCurrentPushToken();

        const [call] = http.callsTo("DELETE", "/notifications/push-token");
        expect(JSON.parse(call.data)).toEqual({ token: "ExponentPushToken[abc]" });
        expect(__getStore()).toEqual({});
    });

    it("não chama a API quando o aparelho não foi registrado", async () => {
        await unregisterCurrentPushToken();

        expect(http.calls).toHaveLength(0);
    });
});
