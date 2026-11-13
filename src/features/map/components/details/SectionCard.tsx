import type { ReactNode } from "react";
import { View } from "react-native";

import { Text } from "@/components/ui/text";

export function SectionCard({
    title,
    children,
}: {
    title: string;
    children: ReactNode;
}) {
    return (
        <View className="mt-4 rounded-2xl bg-white dark:bg-[#1A1D24] p-4">
            <Text className="mb-3 text-xs font-body-semibold uppercase tracking-wide text-[#5D5E63] dark:text-[#AAB0BD]">
                {title}
            </Text>
            {children}
        </View>
    );
}
