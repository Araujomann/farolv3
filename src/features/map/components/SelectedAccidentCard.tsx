import { Image } from "expo-image";
import { CalendarDays, ChevronDown, X } from "lucide-react-native";
import { Keyboard, Pressable, Text, View } from "react-native";

import type { Accident } from "@/src/features/map/types/accident.types";
import {
    formatDateTime,
    translateAccidentType,
    useTranslation,
} from "@/src/i18n";
import { useAppTheme } from "@/src/theme/useAppTheme";
import prfLogo from "../../../../assets/images/prf-logo.png";

type SelectedAccidentCardProps = {
    accident: Accident;
    onClose: () => void;
    onOpenDetails: () => void;
};

/** Resumo do acidente selecionado no mapa, com atalho para os detalhes. */
export function SelectedAccidentCard({
    accident,
    onClose,
    onOpenDetails,
}: SelectedAccidentCardProps) {
    const { t } = useTranslation();
    const { colors, isDark } = useAppTheme();
    return (
        <View
            className="absolute bottom-24 left-4 right-4 overflow-hidden rounded-3xl bg-white dark:bg-[#1A1D24] px-4 py-4 shadow-xl"
            onTouchStart={Keyboard.dismiss}
        >
            {accident.source === "PRF" && (
                <Image
                    source={prfLogo}
                    contentFit="contain"
                    accessibilityElementsHidden
                    pointerEvents="none"
                    style={{
                        position: "absolute",
                        right: 10,
                        top: 0,
                        width: 120,
                        height: 120,
                        opacity: isDark ? 0.16 : 0.11,
                    }}
                />
            )}
            <View className="relative z-10 flex-row items-start justify-between">
                <View className="flex-1 pr-3">
                    <Text className="text-xs font-body-bold uppercase tracking-wide text-gray-500 dark:text-[#8B92A1]">
                        {t("map.selectedAccident")}
                    </Text>
                    <View className="mt-1 flex-row items-center justify-between gap-3">
                        <Text className="flex-1 text-lg font-body-bold text-gray-900 dark:text-[#ECEEF4]">
                            {accident.tipo_acidente
                                ? translateAccidentType(accident.tipo_acidente)
                                : t("map.occurrence")}
                        </Text>
                    </View>
                    <Text className="font-body mt-1 text-sm text-gray-600 dark:text-[#AAB0BD]">
                        {t("map.severity")}:{" "}
                        {t(`enums.severity.${accident.severity}`)}
                    </Text>
                    <View className="mt-2 flex-row items-center">
                        <CalendarDays size={14} color={colors.onSurfaceVariant} />
                        <Text className="ml-1.5 text-xs font-body-medium text-gray-500 dark:text-[#8B92A1]">
                            {formatDateTime(accident.occurred_at)}
                        </Text>
                    </View>
                </View>
                <Pressable
                    accessibilityLabel={t("map.closeDetails")}
                    onPress={onClose}
                    className="rounded-full bg-gray-100 dark:bg-[#242833] p-2"
                >
                    <X size={18} color={colors.onSurface} />
                </Pressable>
            </View>
            <Pressable
                accessibilityRole="button"
                accessibilityLabel={t("map.moreDetailsLabel")}
                onPress={onOpenDetails}
                className="mt-3 items-center border-t border-gray-100 dark:border-[#3A3F4B] pt-2"
            >
                <ChevronDown size={20} color={colors.onSurfaceVariant} />
                <Text className="text-[11px] font-body-medium text-gray-500 dark:text-[#8B92A1]">
                    {t("map.moreDetails")}
                </Text>
            </Pressable>
        </View>
    );
}
