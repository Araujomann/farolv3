import { Pressable, Text, View } from "react-native";

import { useTranslation } from "@/src/i18n";

export type MapViewMode = "markers" | "heatmap";

type MapViewModeToggleProps = {
    viewMode: MapViewMode;
    onShowMarkers: () => void;
    onShowHeatmap: () => void;
};

/** Alterna entre marcadores ("Pinos") e mapa de calor. */
export function MapViewModeToggle({
    viewMode,
    onShowMarkers,
    onShowHeatmap,
}: MapViewModeToggleProps) {
    const { t } = useTranslation();
    return (
        <View className="flex-row rounded-full bg-white dark:bg-[#1A1D24] p-1 shadow-lg">
            <Pressable
                accessibilityLabel={t("map.showMarkers")}
                accessibilityState={{ selected: viewMode === "markers" }}
                onPress={onShowMarkers}
                className={`rounded-full px-3 py-2 ${
                    viewMode === "markers"
                        ? "bg-[#0969D7]"
                        : "bg-transparent"
                }`}
            >
                <Text
                    className={`text-xs font-body-semibold ${
                        viewMode === "markers"
                            ? "text-white"
                            : "text-gray-600 dark:text-[#AAB0BD]"
                    }`}
                >
                    {t("map.pins")}
                </Text>
            </Pressable>
            <Pressable
                accessibilityLabel={t("map.showHeatmap")}
                accessibilityState={{ selected: viewMode === "heatmap" }}
                onPress={onShowHeatmap}
                className={`rounded-full px-3 py-2 ${
                    viewMode === "heatmap"
                        ? "bg-[#0969D7]"
                        : "bg-transparent"
                }`}
            >
                <Text
                    className={`text-xs font-body-semibold ${
                        viewMode === "heatmap"
                            ? "text-white"
                            : "text-gray-600 dark:text-[#AAB0BD]"
                    }`}
                >
                    {t("map.heat")}
                </Text>
            </Pressable>
        </View>
    );
}
