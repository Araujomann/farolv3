import { Car, ChevronRight } from "lucide-react-native";
import { Pressable, View } from "react-native";

import { Text } from "@/components/ui/text";
import type { AccidentOverview } from "@/src/api/accidents";
import { CARD_SHADOW } from "@/src/features/home/constants";
import { useHomeColors } from "@/src/features/home/hooks/useHomeColors";
import {
    formatRelativeTime,
    translateAccidentType,
    useTranslation,
} from "@/src/i18n";

export function RecentAccidentsCard({
    overview,
    onAccidentPress,
    onOpenMap,
}: {
    overview: AccidentOverview;
    onAccidentPress: (accidentId: string) => void;
    onOpenMap: () => void;
}) {
    const { t } = useTranslation();
    const COLORS = useHomeColors();
    return (
        <View
            className="rounded-3xl bg-white dark:bg-[#1A1D24] p-4"
            style={CARD_SHADOW}
        >
            <View className="mb-2 flex-row items-center">
                <Text
                    className="flex-1 text-base font-body-bold"
                    style={{ color: COLORS.text }}
                >
                    {t("home.recentAccidents")}
                </Text>
                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={t("home.openMap")}
                    onPress={onOpenMap}
                    className="h-9 w-9 items-center justify-center rounded-full"
                    style={{ backgroundColor: COLORS.surfaceIcon }}
                >
                    <ChevronRight size={19} color={COLORS.primary} />
                </Pressable>
            </View>
            {overview.recent_accidents.length === 0 ? (
                <Text
                    className="font-body py-4 text-sm"
                    style={{ color: COLORS.secondaryText }}
                >
                    {t("home.noRecentAccidents")}
                </Text>
            ) : (
                overview.recent_accidents.map((accident, index) => (
                    <Pressable
                        key={accident.id}
                        accessibilityRole="button"
                        onPress={() => onAccidentPress(accident.id)}
                        className="flex-row items-center py-3"
                        style={{
                            borderTopWidth: index === 0 ? 0 : 1,
                            borderTopColor: COLORS.border,
                        }}
                    >
                        <View
                            className="mr-3 h-11 w-11 items-center justify-center rounded-full"
                            style={{ backgroundColor: COLORS.surfaceIcon }}
                        >
                            <Car
                                size={21}
                                color={COLORS.primary}
                                strokeWidth={2.2}
                            />
                        </View>
                        <View className="mr-2 flex-1">
                            <Text
                                numberOfLines={1}
                                className="text-sm font-body-bold"
                                style={{ color: COLORS.text }}
                            >
                                {translateAccidentType(accident.tipo_acidente)}
                            </Text>
                            <Text
                                numberOfLines={1}
                                className="font-body mt-0.5 text-xs"
                                style={{ color: COLORS.secondaryText }}
                            >
                                {t(
                                    `enums.classification.${accident.classificacao_acidente}`,
                                )}
                                {" · "}
                                {formatRelativeTime(accident.occurred_at)}
                            </Text>
                        </View>
                        <View
                            className="rounded-4xl px-2.5 py-1"
                            style={{ backgroundColor: COLORS.severity[accident.severity as keyof typeof COLORS.severity] }}
                        >
                    </View>
                    </Pressable>
                ))
            )}
        </View>
    );
}
