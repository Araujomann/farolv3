import * as Location from "expo-location";
import { useFocusEffect } from "expo-router";
import { useCallback, useRef, useState } from "react";

type Coordinates = [number, number];

/**
 * Pede a permissão de localização quando a tela ganha foco (início do fluxo
 * de relato) e obtém a posição atual do usuário, em [longitude, latitude].
 *
 * Primeiro usa a última posição conhecida (instantânea) e depois refina com
 * uma leitura atual do GPS.
 */
export function useUserLocation() {
    const [hasPermission, setHasPermission] = useState(false);
    const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
    const isRequestingRef = useRef(false);
    const hasLocationRef = useRef(false);

    useFocusEffect(
        useCallback(() => {
            if (hasLocationRef.current || isRequestingRef.current) {
                return;
            }

            let isActive = true;
            isRequestingRef.current = true;

            const toCoordinates = (location: Location.LocationObject) => {
                hasLocationRef.current = true;
                return [
                    location.coords.longitude,
                    location.coords.latitude,
                ] as Coordinates;
            };

            (async () => {
                try {
                    const { granted } =
                        await Location.requestForegroundPermissionsAsync();

                    if (!isActive) return;
                    setHasPermission(granted);
                    if (!granted) return;

                    const lastKnown = await Location.getLastKnownPositionAsync({
                        maxAge: 60_000,
                    });

                    if (isActive && lastKnown) {
                        setUserLocation(toCoordinates(lastKnown));
                    }

                    const current = await Location.getCurrentPositionAsync({
                        accuracy: Location.Accuracy.Balanced,
                    });

                    if (isActive) {
                        setUserLocation(toCoordinates(current));
                    }
                } catch {
                    // GPS desligado ou indisponível: o mapa segue no centro padrão.
                } finally {
                    isRequestingRef.current = false;
                }
            })();

            return () => {
                isActive = false;
            };
        }, []),
    );

    return { hasPermission, userLocation };
}
