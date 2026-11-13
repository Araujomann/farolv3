import { useEffect, useState } from "react";

import { reverseGeocode } from "@/src/features/map/services/reverseGeocode";
import { tr } from "@/src/i18n";

/**
 * Endereço da localização confirmada para o relato. Sem coordenadas
 * válidas, expõe a mensagem de localização indisponível como erro.
 */
export function useReportAddress(
    hasLocation: boolean,
    latitude: number,
    longitude: number,
) {
    const [address, setAddress] = useState("");
    const [isLoadingAddress, setIsLoadingAddress] = useState(true);
    const [addressError, setAddressError] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;

        if (!hasLocation) {
            setAddressError(tr("report.form.confirmedLocationUnavailable"));
            setIsLoadingAddress(false);
            return () => {
                isMounted = false;
            };
        }

        reverseGeocode(longitude, latitude)
            .then((resolvedAddress) => {
                if (isMounted) {
                    setAddress(resolvedAddress);
                }
            })
            .catch((error: unknown) => {
                console.warn("Falha ao obter endereço da localização", error);
                if (isMounted) {
                    setAddressError(
                        tr("report.form.addressError"),
                    );
                }
            })
            .finally(() => {
                if (isMounted) {
                    setIsLoadingAddress(false);
                }
            });

        return () => {
            isMounted = false;
        };
    }, [hasLocation, latitude, longitude]);

    return { address, isLoadingAddress, addressError };
}
