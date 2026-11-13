import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { api } from "@/src/api/client";

const PUSH_TOKEN_STORAGE_KEY = "expo_push_token";
export const ACCIDENT_APPROVED_EVENT = "ACCIDENT_APPROVED";

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
    }),
});

export async function registerForPushNotifications() {
    if (
        (Platform.OS !== "android" && Platform.OS !== "ios") ||
        !Device.isDevice
    ) {
        return;
    }

    const projectId =
        process.env.EXPO_PUBLIC_EAS_PROJECT_ID ??
        Constants.expoConfig?.extra?.eas?.projectId ??
        Constants.easConfig?.projectId;

    if (!projectId) {
        throw new Error(
            "Configure EXPO_PUBLIC_EAS_PROJECT_ID or link the app to an EAS project before registering push notifications.",
        );
    }

    if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("default", {
            name: "Notificações",
            importance: Notifications.AndroidImportance.HIGH,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: "#0969D7",
        });
    }

    let permission = await Notifications.getPermissionsAsync();
    if (!permission.granted) {
        permission = await Notifications.requestPermissionsAsync();
    }

    if (!permission.granted) {
        return;
    }

    const pushToken = (
        await Notifications.getExpoPushTokenAsync({ projectId })
    ).data;

    await api.put("/notifications/push-token", {
        token: pushToken,
        platform: Platform.OS,
    });
    await SecureStore.setItemAsync(PUSH_TOKEN_STORAGE_KEY, pushToken);
}

/** Esquece o token salvo localmente sem chamar a API (ex.: conta excluída). */
export async function forgetStoredPushToken() {
    await SecureStore.deleteItemAsync(PUSH_TOKEN_STORAGE_KEY);
}

export async function unregisterCurrentPushToken() {
    const pushToken = await SecureStore.getItemAsync(PUSH_TOKEN_STORAGE_KEY);
    if (!pushToken) {
        return;
    }

    await api.delete("/notifications/push-token", {
        data: { token: pushToken },
    });
    await SecureStore.deleteItemAsync(PUSH_TOKEN_STORAGE_KEY);
}
