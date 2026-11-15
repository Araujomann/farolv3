import { useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { Pressable, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Text } from "@/components/ui/text";
import { useTranslation } from "@/src/i18n";
import { useAppTheme } from "@/src/theme/useAppTheme";

import { TERMS_VERSION_LABEL } from "../legalConfig";
import type { LegalBlock, LegalDocument } from "../legalContent";

/**
 * Exibe um documento legal (Termos de Uso ou Política de Privacidade).
 * Acessível com ou sem sessão: no cadastro, nas configurações e no aceite.
 */
export function LegalDocumentScreen({ document }: { document: LegalDocument }) {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { colors } = useAppTheme();
    const { t } = useTranslation();

    const goBack = () => {
        if (router.canGoBack()) router.back();
        else router.replace("/");
    };

    return (
        <View className="flex-1" style={{ backgroundColor: colors.background }}>
            <View
                className="flex-row items-center justify-between px-4"
                style={{
                    backgroundColor: colors.surface,
                    height: 56 + insets.top,
                    paddingTop: insets.top,
                }}
            >
                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={t("legal.back")}
                    onPress={goBack}
                    className="h-11 w-11 items-center justify-center"
                >
                    <ArrowLeft size={24} color={colors.primary} />
                </Pressable>
                <Text
                    accessibilityRole="header"
                    className="flex-1 text-center text-lg font-body-semibold"
                    numberOfLines={1}
                    style={{ color: colors.onSurface }}
                >
                    {document.title}
                </Text>
                <View className="h-11 w-11" />
            </View>

            <ScrollView
                contentContainerStyle={{
                    paddingHorizontal: 20,
                    paddingTop: 20,
                    paddingBottom: insets.bottom + 40,
                }}
            >
                <Text
                    className="font-body text-[15px] leading-[23px]"
                    style={{ color: colors.onSurface }}
                >
                    {document.intro}
                </Text>

                {document.sections.map((section) => (
                    <View key={section.title} className="mt-6">
                        <Text
                            accessibilityRole="header"
                            className="mb-2 text-[16px] font-body-semibold"
                            style={{ color: colors.onSurface }}
                        >
                            {section.title}
                        </Text>
                        {section.blocks.map((block, index) => (
                            <Block key={index} block={block} />
                        ))}
                    </View>
                ))}

                <Text
                    className="font-body mt-8 text-[13px]"
                    style={{ color: colors.onSurfaceVariant }}
                >
                    {t("legal.version", { date: TERMS_VERSION_LABEL })}
                </Text>
            </ScrollView>
        </View>
    );
}

function Block({ block }: { block: LegalBlock }) {
    const { colors } = useAppTheme();
    const textClass = "font-body flex-1 text-[14px] leading-[22px]";

    if (block.type === "paragraph") {
        return (
            <Text
                className={`${textClass} mb-2`}
                style={{ color: colors.onSurfaceVariant }}
            >
                {block.text}
            </Text>
        );
    }

    return (
        <View className="mb-2 gap-1.5">
            {block.items.map((item) => (
                <View key={item} className="flex-row gap-2 pr-1">
                    <Text style={{ color: colors.onSurfaceVariant }}>•</Text>
                    <Text
                        className={textClass}
                        style={{ color: colors.onSurfaceVariant }}
                    >
                        {item}
                    </Text>
                </View>
            ))}
        </View>
    );
}
