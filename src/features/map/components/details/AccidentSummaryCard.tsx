import { Image } from "expo-image";
import { CalendarDays, MapPin, ShieldCheck } from "lucide-react-native";
import type { ReactNode } from "react";
import { ScrollView, View } from "react-native";

import { Text } from "@/components/ui/text";
import type { AccidentDetail } from "@/src/features/map/types/accident.types";
import {
    formatDateTime as formatDate,
    translateAccidentType,
    useTranslation,
} from "@/src/i18n";
import { useAppTheme } from "@/src/theme/useAppTheme";

type AccidentSummaryCardProps = {
    accident: AccidentDetail;
    imageWidth: number;
    activeImage: number;
    onActiveImageChange: (index: number) => void;
};

/** Fotos (ou placeholder), tipo, severidade e dados principais. */
export function AccidentSummaryCard({
    accident,
    imageWidth,
    activeImage,
    onActiveImageChange,
}: AccidentSummaryCardProps) {
    const { t } = useTranslation();
    const { colors } = useAppTheme();
    return (
        <View className="overflow-hidden rounded-2xl bg-white dark:bg-[#1A1D24]">
            {accident.images.length > 0 ? (
                <View>
                    <ScrollView
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        onMomentumScrollEnd={(event) => {
                            const nextIndex = Math.round(
                                event.nativeEvent.contentOffset.x /
                                    imageWidth,
                            );
                            onActiveImageChange(
                                Math.min(
                                    nextIndex,
                                    accident.images.length - 1,
                                ),
                            );
                        }}
                    >
                        {accident.images.map((image) => (
                            <Image
                                key={image.id}
                                source={{ uri: image.image_url }}
                                contentFit="cover"
                                accessibilityLabel={
                                    image.caption ??
                                    t("accident.imageFallback")
                                }
                                style={{
                                    width: imageWidth,
                                    height: 220,
                                }}
                            />
                        ))}
                    </ScrollView>
                    {accident.images.length > 1 && (
                        <View className="absolute bottom-3 left-0 right-0 flex-row justify-center gap-2">
                            {accident.images.map((image, index) => (
                                <View
                                    key={image.id}
                                    className={`h-2 w-2 rounded-full ${
                                        index === activeImage
                                            ? "bg-white dark:bg-[#1A1D24]"
                                            : "bg-white/50 dark:bg-[#1A1D24]/50"
                                    }`}
                                />
                            ))}
                        </View>
                    )}
                </View>
            ) : (
                <View className="h-45 items-center justify-center bg-[#EAF1FF] dark:bg-[#16253F]">
                    <MapPin size={34} color={colors.primary} />
                    <Text className="mt-2 text-sm font-body-medium text-[#414755] dark:text-[#AAB0BD]">
                        {t("accident.noImage")}
                    </Text>
                </View>
            )}
            <View className="p-4">
                <View className="flex-row items-start justify-between gap-3">
                    <Text className="flex-1 text-[22px] font-display text-[#181C23] dark:text-[#ECEEF4]">
                        {accident.tipo_acidente
                            ? translateAccidentType(accident.tipo_acidente)
                            : t("map.occurrence")}
                    </Text>
                    <View className="rounded-full bg-[#FFF1E8] dark:bg-[#2B2313] px-3 py-1.5">
                        <Text className="text-xs font-body-semibold text-[#B42318] dark:text-[#FF7B70]">
                            {t(`enums.severity.${accident.severity}`)}
                        </Text>
                    </View>
                </View>
                <View className="mt-3 flex-row flex-wrap gap-2">
                    <InfoChip
                        icon={<CalendarDays size={15} color={colors.onSurfaceVariant} />}
                        label={formatDate(accident.occurred_at)}
                    />
                    <InfoChip
                        icon={<ShieldCheck size={15} color={colors.onSurfaceVariant} />}
                        label={t(
                            `enums.classification.${accident.classificacao_acidente}`,
                        )}
                    />
                    <InfoChip
                        icon={<MapPin size={15} color={colors.onSurfaceVariant} />}
                        label={t(
                            `enums.weather.${accident.condicao_meteorologica}`,
                        )}
                    />
                </View>
            </View>
        </View>
    );
}

function InfoChip({ icon, label }: { icon: ReactNode; label: string }) {
    return (
        <View className="flex-row items-center gap-1.5 rounded-full bg-[#F1F3FE] dark:bg-[#242833] px-2.5 py-1.5">
            {icon}
            <Text className="text-xs font-body-medium text-[#414755] dark:text-[#AAB0BD]">{label}</Text>
        </View>
    );
}
