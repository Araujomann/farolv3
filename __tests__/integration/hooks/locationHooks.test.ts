/**
 * Hooks de localização e endereço com GPS (`expo-location`) e
 * geocodificação reversa (Mapbox) SIMULADOS.
 */
import { renderHook, waitFor } from "@testing-library/react-native";
import * as Location from "expo-location";

import { useAccidentAddress } from "@/src/features/map/hooks/useAccidentAddress";
import * as geocoding from "@/src/features/map/services/reverseGeocode";
import { useReportAddress } from "@/src/features/report/hooks/useReportAddress";
import { useUserLocation } from "@/src/features/report/hooks/useUserLocation";
import { tr } from "@/src/i18n";
import type { AccidentDetail } from "@/src/features/map/types/accident.types";
import { makeAccidentDetail } from "@/test/fixtures";
import { silenceConsole } from "@/test/utils/console";

jest.mock("expo-router", () => require("@/test/mocks/expoRouter"));
jest.mock("@/src/features/map/services/reverseGeocode");
jest.mock("expo-location", () => ({
    Accuracy: { Balanced: 3 },
    requestForegroundPermissionsAsync: jest.fn(),
    getLastKnownPositionAsync: jest.fn(),
    getCurrentPositionAsync: jest.fn(),
}));

const reverseGeocode = jest.mocked(geocoding.reverseGeocode);
const location = jest.mocked(Location);
const position = (longitude: number, latitude: number) =>
    ({ coords: { longitude, latitude } }) as Location.LocationObject;

describe("useUserLocation", () => {
    it("usa a última posição conhecida e depois refina com o GPS", async () => {
        location.requestForegroundPermissionsAsync.mockResolvedValue({ granted: true } as never);
        location.getLastKnownPositionAsync.mockResolvedValue(position(-47.1, -5.1));
        let finishGps: () => void = () => undefined;
        location.getCurrentPositionAsync.mockReturnValue(
            new Promise((resolve) => {
                finishGps = () => resolve(position(-47.2, -5.2));
            }),
        );

        const { result } = renderHook(() => useUserLocation());

        await waitFor(() => expect(result.current.userLocation).toEqual([-47.1, -5.1]));
        expect(result.current.hasPermission).toBe(true);
        finishGps();
        await waitFor(() => expect(result.current.userLocation).toEqual([-47.2, -5.2]));
    });

    it("não lê o GPS quando a permissão é negada", async () => {
        location.requestForegroundPermissionsAsync.mockResolvedValue({ granted: false } as never);

        const { result } = renderHook(() => useUserLocation());

        await waitFor(() =>
            expect(location.requestForegroundPermissionsAsync).toHaveBeenCalled(),
        );
        expect(result.current.hasPermission).toBe(false);
        expect(result.current.userLocation).toBeNull();
        expect(location.getCurrentPositionAsync).not.toHaveBeenCalled();
    });

    it("segue sem localização quando o GPS está desligado", async () => {
        location.requestForegroundPermissionsAsync.mockResolvedValue({ granted: true } as never);
        location.getLastKnownPositionAsync.mockResolvedValue(null);
        location.getCurrentPositionAsync.mockRejectedValue(new Error("GPS off"));

        const { result } = renderHook(() => useUserLocation());

        await waitFor(() => expect(location.getCurrentPositionAsync).toHaveBeenCalled());
        expect(result.current.hasPermission).toBe(true);
        expect(result.current.userLocation).toBeNull();
    });
});

describe("useReportAddress", () => {
    it("resolve o endereço da localização confirmada", async () => {
        reverseGeocode.mockResolvedValue("Rua Ceará, Imperatriz");

        const { result } = renderHook(() => useReportAddress(true, -5.5, -47.4));

        await waitFor(() => expect(result.current.isLoadingAddress).toBe(false));
        expect(reverseGeocode).toHaveBeenCalledWith(-47.4, -5.5);
        expect(result.current.address).toBe("Rua Ceará, Imperatriz");
        expect(result.current.addressError).toBeNull();
    });

    it("informa localização indisponível sem coordenadas", async () => {
        const { result } = renderHook(() => useReportAddress(false, Number.NaN, Number.NaN));

        await waitFor(() => expect(result.current.isLoadingAddress).toBe(false));
        expect(result.current.addressError).toBe(
            tr("report.form.confirmedLocationUnavailable"),
        );
        expect(reverseGeocode).not.toHaveBeenCalled();
    });

    it("informa falha na busca do endereço", async () => {
        silenceConsole();
        reverseGeocode.mockRejectedValue(new Error("Mapbox fora do ar"));

        const { result } = renderHook(() => useReportAddress(true, -5.5, -47.4));

        await waitFor(() => expect(result.current.isLoadingAddress).toBe(false));
        expect(result.current.addressError).toBe(tr("report.form.addressError"));
    });
});

describe("useAccidentAddress", () => {
    it("não busca enquanto o acidente não carregou", () => {
        const { result } = renderHook(() => useAccidentAddress(null));

        expect(result.current).toEqual({ address: null, isLoadingAddress: false });
        expect(reverseGeocode).not.toHaveBeenCalled();
    });

    it("busca o endereço uma vez por coordenada", async () => {
        reverseGeocode.mockResolvedValue("Av. Getúlio Vargas");
        const accident = makeAccidentDetail();
        const { result, rerender } = renderHook(
            ({ value }: { value: AccidentDetail }) => useAccidentAddress(value),
            { initialProps: { value: accident } },
        );
        await waitFor(() => expect(result.current.address).toBe("Av. Getúlio Vargas"));

        // Chegou um comentário: mesmo acidente, mesmas coordenadas.
        rerender({ value: { ...accident, comments: [] } });

        expect(reverseGeocode).toHaveBeenCalledTimes(1);
    });

    it("deixa o endereço vazio quando a busca falha", async () => {
        silenceConsole();
        reverseGeocode.mockRejectedValue(new Error("offline"));

        const { result } = renderHook(() => useAccidentAddress(makeAccidentDetail()));

        await waitFor(() => expect(result.current.isLoadingAddress).toBe(false));
        expect(result.current.address).toBeNull();
    });
});
