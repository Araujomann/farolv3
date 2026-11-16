import { useEffect, useRef } from "react";
import { useRouter } from "expo-router";
import * as Notifications from "expo-notifications";
import { ACCIDENT_APPROVED_EVENT } from "./pushNotifications";

/** ID do acidente aprovado que a notificação tocada aponta, se houver. */
function getApprovedAccidentId(
    response: Notifications.NotificationResponse,
): string | null {
    if (response.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) {
        return null;
    }

    const { type, accidentId } = response.notification.request.content.data;
    return type === ACCIDENT_APPROVED_EVENT && typeof accidentId === "string"
        ? accidentId
        : null;
}

/**
 * Ao tocar na notificação de acidente aprovado — com o app aberto, em segundo
 * plano ou fechado — abre o mapa centralizado nesse acidente.
 *
 * `canNavigate` deve ser verdadeiro só quando o usuário já está na área logada
 * (sessão restaurada e termos aceitos); até lá o toque fica guardado.
 */
export function useNotificationNavigation(canNavigate: boolean) {
    const router = useRouter();
    const lastResponse = Notifications.useLastNotificationResponse();
    const handledResponseId = useRef<string | null>(null);

    useEffect(() => {
        if (!canNavigate || !lastResponse) {
            return;
        }

        const responseId = lastResponse.notification.request.identifier;
        if (handledResponseId.current === responseId) {
            return;
        }
        handledResponseId.current = responseId;

        const accidentId = getApprovedAccidentId(lastResponse);
        // Limpa para o mesmo toque não reabrir o mapa quando o app voltar.
        Notifications.clearLastNotificationResponse();
        if (!accidentId) {
            return;
        }

        router.navigate({
            pathname: "/map",
            params: {
                focusAccidentId: accidentId,
                focusRequest: String(Date.now()),
            },
        });
    }, [canNavigate, lastResponse, router]);
}
