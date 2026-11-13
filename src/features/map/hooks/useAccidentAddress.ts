import { useEffect, useState } from "react";

import { reverseGeocode } from "@/src/features/map/services/reverseGeocode";
import type { AccidentDetail } from "@/src/features/map/types/accident.types";

/**
 * Endereço do acidente carregado. Só refaz a busca quando o acidente ou
 * suas coordenadas mudam (não quando chegam comentários ou selos).
 * Em caso de falha, o endereço fica `null`.
 */
export function useAccidentAddress(accident: AccidentDetail | null) {
    const [address, setAddress] = useState<string | null>(null);
    const [isLoadingAddress, setIsLoadingAddress] = useState(false);

    const addressAccidentId = accident?.id;
    const addressLongitude = accident?.longitude;
    const addressLatitude = accident?.latitude;

    useEffect(() => {
        if (
            addressAccidentId === undefined ||
            addressLongitude === undefined ||
            addressLatitude === undefined
        ) {
            return;
        }

        let isCurrent = true;
        setAddress(null);
        setIsLoadingAddress(true);

        reverseGeocode(addressLongitude, addressLatitude)
            .then((result) => {
                if (isCurrent) setAddress(result);
            })
            .catch((addressError) => {
                if (__DEV__) {
                    console.warn(
                        "Falha ao carregar o endereço do acidente",
                        addressError,
                    );
                }
            })
            .finally(() => {
                if (isCurrent) setIsLoadingAddress(false);
            });

        return () => {
            isCurrent = false;
        };
    }, [addressAccidentId, addressLatitude, addressLongitude]);

    return { address, isLoadingAddress };
}
