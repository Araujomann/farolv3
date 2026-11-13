import { View } from "react-native";

import { Text } from "@/components/ui/text";
import type { StatusFilter } from "@/src/features/profile/constants/reportStatusFilters";
import { useTranslation } from "@/src/i18n";

/** Estado vazio de "Meus relatos" para o status selecionado. */
export function EmptyReports({ filter }: { filter: StatusFilter }) {
    const { t } = useTranslation();
    const Icon = filter.icon;

    return (
        <View className="items-center rounded-2xl bg-white dark:bg-[#1A1D24] px-6 py-10">
            <View
                className="mb-4 h-14 w-14 items-center justify-center rounded-full"
                style={{ backgroundColor: filter.background }}
            >
                <Icon size={26} color={filter.color} />
            </View>
            <Text className="text-center text-base font-body-semibold text-[#181C23] dark:text-[#ECEEF4]">
                {t("reports.emptyTitle", {
                    status: filter.label.toLowerCase(),
                })}
            </Text>
            <Text className="font-body mt-2 text-center text-sm leading-5 text-[#626B7A] dark:text-[#AAB0BD]">
                {t("reports.emptyMessage")}
            </Text>
        </View>
    );
}
