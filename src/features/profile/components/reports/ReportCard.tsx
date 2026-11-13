import { Image } from "expo-image";
import { MapPin } from "lucide-react-native";
import { memo, useEffect, useState } from "react";
import { View } from "react-native";

import { Text } from "@/components/ui/text";
import type { MyReport } from "@/src/api/reports";
import { reverseGeocode } from "@/src/features/map/services/reverseGeocode";
import type { StatusFilter } from "@/src/features/profile/constants/reportStatusFilters";
import { getDateTimeFormatter, useTranslation, type Language } from "@/src/i18n";
import { useAppTheme } from "@/src/theme/useAppTheme";

/** Card de um relato em "Meus relatos", com endereço resolvido sob demanda. */
export const ReportCard = memo(function ReportCard({
    report,
    filter,
}: {
    report: MyReport;
    filter: StatusFilter;
}) {
    const { t, language } = useTranslation();
    const { colors } = useAppTheme();
    const StatusIcon = filter.icon;
    const image = report.images[0];
    const [address, setAddress] = useState(() => t("reports.searchingAddress"));

    useEffect(() => {
        let isMounted = true;

        // Endereços ficam em cache no serviço: voltar à tela ou rolar a
        // lista não refaz a chamada ao Mapbox.
        reverseGeocode(report.longitude, report.latitude)
            .then((resolvedAddress) => {
                if (isMounted) setAddress(resolvedAddress);
            })
            .catch((cause: unknown) => {
                if (__DEV__) {
                    console.warn(
                        `Falha ao buscar endereço do relato ${report.id}`,
                        cause,
                    );
                }
                if (isMounted) setAddress(t("reports.addressUnavailable"));
            });

        return () => {
            isMounted = false;
        };
    }, [report.id, report.latitude, report.longitude, t]);

    return (
        <View className="overflow-hidden rounded-2xl bg-white dark:bg-[#1A1D24] p-4">
            <View className="mb-3 flex-row items-start justify-between gap-3">
                <Text
                    className="flex-1 text-[18px] font-display-semibold leading-6 text-[#181C23] dark:text-[#ECEEF4]"
                    numberOfLines={2}
                >
                    {report.tipo_acidente}
                </Text>
                <View
                    accessibilityLabel={filter.label}
                    className="h-8 w-8 items-center justify-center rounded-full"
                    style={{ backgroundColor: filter.background }}
                >
                    <StatusIcon
                        size={17}
                        color={filter.color}
                        strokeWidth={2.6}
                    />
                </View>
            </View>

            <Text className="font-body mb-3 text-[13px] text-[#414755] dark:text-[#AAB0BD]">
                {formatOccurrenceDate(report.occurred_at, language) ??
                    t("reports.dateUnavailable")}{" "}
                <Text className="text-[#7B8290] dark:text-[#8B92A1]">•</Text>{" "}
                {report.latitude.toFixed(4)}, {report.longitude.toFixed(4)}
            </Text>

            <View className="mb-3 flex-row items-start gap-2">
                <MapPin size={17} color={colors.primary} />
                <Text
                    className="font-body flex-1 text-[13px] leading-5 text-[#414755] dark:text-[#AAB0BD]"
                    accessibilityLabel={t("reports.addressLabel", { address })}
                >
                    {address}
                </Text>
            </View>

            {image ? (
                <View className="h-40 w-full overflow-hidden rounded-xl bg-[#E8ECF2] dark:bg-[#242833]">
                    {/* expo-image: cache em disco/memória e decodificação fora da thread JS. */}
                    <Image
                        accessibilityLabel={image.caption ?? t("reports.imageFallback")}
                        source={{ uri: image.image_url }}
                        contentFit="cover"
                        cachePolicy="memory-disk"
                        recyclingKey={image.image_url}
                        transition={150}
                        style={{ width: "100%", height: "100%" }}
                    />
                </View>
            ) : null}

            {report.moderation_status === "REJECTED" && (
                <View className="mt-3 rounded-xl bg-[#FFF2F0] dark:bg-[#2C1715] p-3">
                    <Text className="mb-1 text-[13px] font-body-semibold text-[#9F2018] dark:text-[#FF7B70]">
                        {t("reports.rejectionReason")}
                    </Text>
                    <Text className="font-body text-[13px] leading-5 text-[#6F2924] dark:text-[#F2B8B5]">
                        {report.moderation_message?.trim() ||
                            t("reports.noRejectionReason")}
                    </Text>
                </View>
            )}
        </View>
    );
});

const OCCURRENCE_DATE_FORMAT: Intl.DateTimeFormatOptions = {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
};

function formatOccurrenceDate(value: string, language: Language) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;

    return getDateTimeFormatter(language, OCCURRENCE_DATE_FORMAT).format(date);
}
