import { MapPin } from "lucide-react-native";
import { ActivityIndicator, Text, View } from "react-native";

import { FieldLabel } from "@/src/features/report/components/form/FieldLabel";
import { useTranslation } from "@/src/i18n";
import { useAppTheme } from "@/src/theme/useAppTheme";

type LocationCardProps = {
    isLoadingAddress: boolean;
    address: string;
    addressError: string | null;
    hasLocation: boolean;
    latitude: number;
    longitude: number;
};

export function LocationCard({
    isLoadingAddress,
    address,
    addressError,
    hasLocation,
    latitude,
    longitude,
}: LocationCardProps) {
    const { t } = useTranslation();
    const { colors } = useAppTheme();
    return (
        <View className="mb-5 rounded-3xl bg-white dark:bg-[#1A1D24] p-4 shadow-lg">
            <FieldLabel label={t("report.form.location")} />
            <View className="mt-2 flex-row items-start rounded-2xl border border-[#C1C6D7]/50 dark:border-[#3A3F4B]/50 bg-[#F8F9FF] dark:bg-[#0E1015] px-3 py-3">
                <MapPin
                    size={19}
                    color={colors.primary}
                    strokeWidth={2.25}
                />
                <View className="ml-2 flex-1">
                    {isLoadingAddress ? (
                        <View className="flex-row items-center">
                            <ActivityIndicator
                                size="small"
                                color={colors.primary}
                            />
                            <Text className="font-body ml-2 text-sm text-[#717786] dark:text-[#8B92A1]">
                                {t("report.form.searchingAddress")}
                            </Text>
                        </View>
                    ) : (
                        <Text className="font-body text-[15px] leading-5 text-[#181C23] dark:text-[#ECEEF4]">
                            {addressError ?? address}
                        </Text>
                    )}
                    <Text className="font-body mt-1 text-xs text-[#717786] dark:text-[#8B92A1]">
                        {hasLocation
                            ? `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
                            : t("report.form.coordinatesUnavailable")}
                    </Text>
                </View>
            </View>
        </View>
    );
}
