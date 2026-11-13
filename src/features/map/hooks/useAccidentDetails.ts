import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, Linking } from "react-native";

import {
    createAccidentComment,
    getAccidentDetails,
    getAccidentTrust,
    setAccidentTrust,
} from "@/src/features/map/services/accidentService";
import type { AccidentDetail } from "@/src/features/map/types/accident.types";
import { tr } from "@/src/i18n";

/**
 * Detalhes de um acidente: carregamento (com selos de confiança), envio de
 * comentários, alternância do selo do usuário e abertura no mapa externo.
 * Respostas de carregamentos antigos são descartadas.
 */
export function useAccidentDetails(accidentId: string | undefined) {
    const requestId = useRef(0);
    const [accident, setAccident] = useState<AccidentDetail | null>(null);
    const [trustedByMe, setTrustedByMe] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [comment, setComment] = useState("");
    const [isSendingComment, setIsSendingComment] = useState(false);
    const [isUpdatingTrust, setIsUpdatingTrust] = useState(false);
    const [commentError, setCommentError] = useState<string | null>(null);
    const [trustError, setTrustError] = useState<string | null>(null);
    const [activeImage, setActiveImage] = useState(0);

    const loadAccident = useCallback(async () => {
        const currentRequestId = ++requestId.current;
        if (!accidentId) {
            setError(tr("accident.invalidId"));
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);
        setCommentError(null);
        setTrustError(null);

        try {
            const [detailsResult, trustResult] = await Promise.allSettled([
                getAccidentDetails(accidentId),
                getAccidentTrust(accidentId),
            ]);

            if (detailsResult.status === "rejected") {
                throw detailsResult.reason;
            }

            const details = detailsResult.value;
            const trust =
                trustResult.status === "fulfilled"
                    ? trustResult.value
                    : null;

            if (requestId.current === currentRequestId) {
                setAccident({
                    ...details,
                    trusted_count:
                        trust?.trusted_count ?? details.trusted_count ?? 0,
                });
                setTrustedByMe(trust?.trusted_by_me ?? false);
                if (trustResult.status === "rejected") {
                    if (__DEV__) {
                        console.warn(
                            "Falha ao carregar os selos de confiança",
                            trustResult.reason,
                        );
                    }
                    setTrustError(
                        tr("accident.trustLoadError"),
                    );
                }
                setActiveImage(0);
            }
        } catch (loadError) {
            if (__DEV__) {
                console.warn("Falha ao carregar detalhes do acidente", loadError);
            }
            if (requestId.current === currentRequestId) {
                setError(
                    tr("accident.loadError"),
                );
            }
        } finally {
            if (requestId.current === currentRequestId) {
                setIsLoading(false);
            }
        }
    }, [accidentId]);

    useEffect(() => {
        void loadAccident();
        return () => {
            requestId.current += 1;
        };
    }, [loadAccident]);

    const handleSendComment = useCallback(async () => {
        const body = comment.trim();
        if (!accidentId || !body || isSendingComment) return;

        setIsSendingComment(true);
        setCommentError(null);
        try {
            const createdComment = await createAccidentComment(accidentId, body);
            setAccident((current) =>
                current
                    ? {
                          ...current,
                          comments: [...current.comments, createdComment],
                      }
                    : current,
            );
            setComment("");
        } catch (commentError) {
            if (__DEV__) {
                console.warn("Falha ao publicar comentário", commentError);
            }
            setCommentError(
                tr("accident.commentError"),
            );
        } finally {
            setIsSendingComment(false);
        }
    }, [accidentId, comment, isSendingComment]);

    const handleToggleTrust = useCallback(async () => {
        if (!accidentId || !accident || isUpdatingTrust) return;

        setIsUpdatingTrust(true);
        setTrustError(null);
        try {
            const nextTrust = await setAccidentTrust(
                accidentId,
                !trustedByMe,
            );
            setTrustedByMe(nextTrust.trusted_by_me);
            setAccident((current) =>
                current
                    ? { ...current, trusted_count: nextTrust.trusted_count }
                    : current,
            );
        } catch (trustError) {
            if (__DEV__) {
                console.warn("Falha ao atualizar selo de confiança", trustError);
            }
            setTrustError(
                tr("accident.trustError"),
            );
        } finally {
            setIsUpdatingTrust(false);
        }
    }, [accident, accidentId, isUpdatingTrust, trustedByMe]);

    const handleOpenMap = useCallback(async () => {
        if (!accident) return;
        const url = `https://maps.google.com/?q=${accident.latitude},${accident.longitude}`;

        try {
            await Linking.openURL(url);
        } catch (openError) {
            if (__DEV__) {
                console.warn("Falha ao abrir a localização", openError);
            }
            Alert.alert(
                tr("accident.openMapErrorTitle"),
                tr("accident.openMapErrorMessage"),
            );
        }
    }, [accident]);

    return {
        accident,
        trustedByMe,
        isLoading,
        error,
        comment,
        setComment,
        isSendingComment,
        isUpdatingTrust,
        commentError,
        trustError,
        activeImage,
        setActiveImage,
        loadAccident,
        handleSendComment,
        handleToggleTrust,
        handleOpenMap,
    };
}
