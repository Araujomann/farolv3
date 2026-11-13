import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";

/** Caixa vermelha com o erro retornado pela API. */
export function AuthServerError({ message }: { message: string }) {
    return (
        <Box className="rounded-xl bg-red-50 dark:bg-[#2C1715] px-4 py-3">
            <Text className="font-body text-sm text-red-700 dark:text-[#FF7B70]">{message}</Text>
        </Box>
    );
}
