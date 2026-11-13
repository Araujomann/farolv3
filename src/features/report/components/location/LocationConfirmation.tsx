import { Check } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";

import { useTranslation } from "@/src/i18n";

type LocationConfirmationProps = {
    /** Local escolhido, em [longitude, latitude]. */
    selectedLocation: [number, number];
    isConfirmed: boolean;
    onConfirm: () => void;
};

/** Coordenadas do centro do mapa e o botão de confirmar o local. */
export function LocationConfirmation({
    selectedLocation,
    isConfirmed,
    onConfirm,
}: LocationConfirmationProps) {
    const { t } = useTranslation();
    return (
        <>
            <View className="mx-auto flex-row items-center gap-6 rounded-full border border-[#717786]/30 bg-white/85 dark:bg-[#1A1D24]/85 px-5 py-2.5 shadow-md">
                <Coordinate label={t("report.latitude")} value={selectedLocation[1]} />
                <View className="h-6 w-px bg-[#717786]/40" />
                <Coordinate
                    label={t("report.longitude")}
                    value={selectedLocation[0]}
                />
            </View>
            <Pressable
                accessibilityLabel={t("report.confirmLocationLabel")}
                accessibilityState={{ disabled: isConfirmed }}
                disabled={isConfirmed}
                onPress={onConfirm}
                className={`h-14 flex-row items-center justify-center gap-2 rounded-xl shadow-lg ${
                    isConfirmed ? "bg-[#16803C]" : "bg-[#0058BC]"
                }`}
            >
                {isConfirmed && <Check size={21} color="#FFFFFF" />}
                <Text className="text-[17px] font-body-bold text-white">
                    {isConfirmed
                        ? t("report.locationConfirmed")
                        : t("report.confirmLocation")}
                </Text>
            </Pressable>
        </>
    );
}

function Coordinate({ label, value }: { label: string; value: number }) {
    return (
        <View className="items-center">
            <Text className="mb-0.5 text-[10px] font-body-semibold uppercase tracking-wider text-[#717786] dark:text-[#8B92A1]">
                {label}
            </Text>
            <Text className="text-xs font-body-medium tabular-nums text-[#181C23] dark:text-[#ECEEF4]">
                {value.toFixed(6)}
            </Text>
        </View>
    );
}
