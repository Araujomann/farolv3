import { useEffect } from "react";
import { registerForPushNotifications } from "./pushNotifications";

export function usePushNotifications(isAuthenticated: boolean) {
    useEffect(() => {
        if (!isAuthenticated) {
            return;
        }

        void registerForPushNotifications().catch((error: unknown) => {
            console.error("Falha ao registrar notificações push", error);
        });
    }, [isAuthenticated]);
}
