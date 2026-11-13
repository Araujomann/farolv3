import { Image } from "react-native";

import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { useTranslation } from "@/src/i18n";

/** Logotipo e nome do app no topo das telas de autenticação. */
export function AuthBrand() {
    const { t } = useTranslation();
    return (
        <Box className="w-full flex-row items-center justify-center gap-1.5 pt-4 pb-2">
            <Image
                source={require("../../../../assets/images/app-icon.png")}
                resizeMode="contain"
                style={{ width: 36, height: 36 }}
                accessibilityLabel={t("auth.logoLabel")}
            />
            <Text className="text-xl font-display tracking-tight text-slate-900 dark:text-[#ECEEF4]">
                Farol
            </Text>
        </Box>
    );
}
