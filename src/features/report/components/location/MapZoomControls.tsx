import { Crosshair, Minus, Plus } from "lucide-react-native";
import { Pressable, View } from "react-native";

import { useTranslation } from "@/src/i18n";
import { useAppTheme } from "@/src/theme/useAppTheme";

type MapZoomControlsProps = {
    onZoomIn: () => void;
    onZoomOut: () => void;
    onRecenter: () => void;
};

/** Botões de zoom e de recentralizar do mapa expandido. */
export function MapZoomControls({
    onZoomIn,
    onZoomOut,
    onRecenter,
}: MapZoomControlsProps) {
    const { t } = useTranslation();
    const { colors } = useAppTheme();
    return (
        <>
            <View className="overflow-hidden rounded-xl border border-[#C1C6D7]/30 dark:border-[#3A3F4B]/30 bg-white/90 dark:bg-[#1A1D24]/90 shadow-lg">
                <Pressable
                    accessibilityLabel={t("report.zoomIn")}
                    onPress={onZoomIn}
                    className="border-b border-[#C1C6D7]/20 dark:border-[#3A3F4B]/20 p-2.5"
                >
                    <Plus size={20} color={colors.onSurface} />
                </Pressable>
                <Pressable
                    accessibilityLabel={t("report.zoomOut")}
                    onPress={onZoomOut}
                    className="p-2.5"
                >
                    <Minus size={20} color={colors.onSurface} />
                </Pressable>
            </View>
            <Pressable
                accessibilityLabel={t("report.recenter")}
                onPress={onRecenter}
                className="h-10 w-10 items-center justify-center rounded-xl border border-[#C1C6D7]/30 dark:border-[#3A3F4B]/30 bg-white/90 dark:bg-[#1A1D24]/90 shadow-lg"
            >
                <Crosshair size={20} color={colors.onSurface} />
            </Pressable>
        </>
    );
}
