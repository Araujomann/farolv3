import { Text } from "react-native";

export function FieldLabel({
    label,
    required = false,
}: {
    label: string;
    required?: boolean;
}) {
    return (
        <Text className="text-[16px] font-display text-[#181C23] dark:text-[#ECEEF4]">
            {label}
            {required && <Text className="text-[#B42318] dark:text-[#FF7B70]"> *</Text>}
        </Text>
    );
}
