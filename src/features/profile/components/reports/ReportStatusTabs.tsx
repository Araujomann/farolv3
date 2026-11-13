import { Pressable, View } from "react-native";

import type { ReportStatus } from "@/src/api/reports";
import type { StatusFilter } from "@/src/features/profile/constants/reportStatusFilters";
import { useAppTheme } from "@/src/theme/useAppTheme";

type ReportStatusTabsProps = {
    filters: StatusFilter[];
    selectedStatus: ReportStatus;
    onSelect: (status: ReportStatus) => void;
};

/** Abas de status (aprovados, pendentes, rejeitados) de "Meus relatos". */
export function ReportStatusTabs({
    filters,
    selectedStatus,
    onSelect,
}: ReportStatusTabsProps) {
    const { colors } = useAppTheme();
    return (
        <View className="mb-5 flex-row rounded-2xl bg-[#E3E5EF] dark:bg-[#242833] p-1">
            {filters.map((filter) => {
                const Icon = filter.icon;
                const isSelected = selectedStatus === filter.status;

                return (
                    <Pressable
                        key={filter.status}
                        accessibilityRole="tab"
                        accessibilityLabel={filter.label}
                        accessibilityState={{ selected: isSelected }}
                        onPress={() => onSelect(filter.status)}
                        className="h-11 flex-1 items-center justify-center rounded-xl"
                        style={{
                            backgroundColor: isSelected
                                ? colors.surface
                                : "transparent",
                        }}
                    >
                        <Icon
                            size={21}
                            color={isSelected ? filter.color : colors.onSurfaceVariant}
                            strokeWidth={2.5}
                        />
                    </Pressable>
                );
            })}
        </View>
    );
}
