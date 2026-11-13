import type { LucideIcon } from "lucide-react-native";
import { View } from "react-native";

import { Text } from "@/components/ui/text";
import { useHomeColors } from "@/src/features/home/hooks/useHomeColors";

/** Título de seção da Home, com ícone à esquerda. */
export function SectionHeading({
    icon: Icon,
    title,
}: {
    icon: LucideIcon;
    title: string;
}) {
    const COLORS = useHomeColors();
    return (
        <View className="mb-5 flex-row items-center">
            <Icon size={20} color={COLORS.primary} strokeWidth={2.2} />
            <Text
                className="ml-2 text-lg font-body-bold"
                style={{ color: COLORS.text }}
            >
                {title}
            </Text>
        </View>
    );
}
