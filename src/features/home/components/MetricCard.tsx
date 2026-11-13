import type { Car } from "lucide-react-native";
import { View } from "react-native";

import { Text } from "@/components/ui/text";
import { CARD_SHADOW } from "@/src/features/home/constants";
import { useHomeColors } from "@/src/features/home/hooks/useHomeColors";
import { formatNumber } from "@/src/i18n";

export function MetricCard({
    icon: Icon,
    label,
    value,
    detail,
}: {
    icon: typeof Car;
    label: string;
    value: number;
    detail: string;
}) {
    const COLORS = useHomeColors();
    return (
        <View
            className="min-h-[150px] flex-1 rounded-3xl bg-white dark:bg-[#1A1D24] p-4"
            style={CARD_SHADOW}
        >
            <View
                className="mb-3 h-10 w-10 items-center justify-center rounded-full"
                style={{ backgroundColor: COLORS.surfaceIcon }}
            >
                <Icon size={21} color={COLORS.primary} strokeWidth={2.2} />
            </View>
            <Text
                className="text-[26px] font-display leading-8"
                style={{ color: COLORS.text }}
            >
                {formatNumber(value)}
            </Text>
            <Text
                className="mt-0.5 text-sm font-body-semibold"
                style={{ color: COLORS.text }}
            >
                {label}
            </Text>
            <Text
                className="font-body mt-1 text-xs leading-4"
                style={{ color: COLORS.secondaryText }}
            >
                {detail}
            </Text>
        </View>
    );
}
