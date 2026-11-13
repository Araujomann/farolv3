import Constants from "expo-constants";
import {
    ArrowLeft,
    ClipboardCheck,
    MapPinned,
    ShieldAlert,
    ShieldCheck,
    type LucideIcon,
} from "lucide-react-native";
import {
    Image,
    Pressable,
    ScrollView,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Text } from "@/components/ui/text";

import { useAppTheme } from "@/src/theme/useAppTheme";
import { useTranslation } from "@/src/i18n";

type AboutScreenProps = {
    onClose: () => void;
};

type AboutItemProps = {
    icon: LucideIcon;
    title: string;
    description: string;
};

function AboutItem({ icon: Icon, title, description }: AboutItemProps) {
    const { colors } = useAppTheme();
    return (
        <View className="flex-row gap-3 px-4 py-4">
            <View className="h-10 w-10 items-center justify-center rounded-xl bg-[#EAF1FC] dark:bg-[#16253F]">
                <Icon size={21} color={colors.primary} strokeWidth={2} />
            </View>
            <View className="flex-1 gap-1">
                <Text className="text-[15px] font-body-semibold" style={{ color: colors.onSurface }}>
                    {title}
                </Text>
                <Text className="font-body text-[14px] leading-[21px]" style={{ color: colors.onSurfaceVariant }}>
                    {description}
                </Text>
            </View>
        </View>
    );
}

function Divider() {
    return <View className="ml-[68px] h-px bg-[#F0F1F6]" />;
}

export default function AboutScreen({ onClose }: AboutScreenProps) {
    const { t } = useTranslation();
    const { colors } = useAppTheme();
    const insets = useSafeAreaInsets();
    const version = Constants.expoConfig?.version ?? "—";

    return (
        <View className="flex-1" style={{ backgroundColor: colors.background }}>
            <View
                className="flex-row items-center px-4"
                style={{
                    backgroundColor: colors.surface,
                    paddingTop: insets.top + 4,
                    height: 56 + insets.top,
                }}
            >
                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={t("about.close")}
                    onPress={onClose}
                    hitSlop={8}
                    className="h-11 w-11 items-center justify-center"
                >
                    <ArrowLeft size={24} color={colors.primary} strokeWidth={2} />
                </Pressable>
                <Text
                    className="flex-1 text-center text-lg font-body-semibold"
                    style={{ color: colors.onSurface, marginRight: 44 }}
                >
                    {t("about.title")}
                </Text>
            </View>

            <ScrollView
                className="flex-1"
                contentContainerStyle={{
                    paddingHorizontal: 16,
                    paddingTop: 20,
                    paddingBottom: insets.bottom + 32,
                }}
                showsVerticalScrollIndicator={false}
            >
                <View className="items-center rounded-2xl bg-white dark:bg-[#1A1D24] px-6 py-7">
                    <Image
                        source={require("../../../../assets/images/app-icon.png")}
                        accessibilityLabel={t("about.logoLabel")}
                        className=" w-36 h-23 rounded-2xl"
                    />
                    <Text className="mt-4 text-[26px] font-display" style={{ color: colors.onSurface }}>
                        Farol
                    </Text>
                    <Text
                        className="font-body mt-2 text-center text-[15px] leading-5.5"
                        style={{ color: colors.onSurfaceVariant }}
                    >
                        {t("about.tagline")}
                    </Text>
                </View>

                <Text
                    className="mb-2 mt-6 text-[17px] font-body-bold"
                    style={{ color: colors.onSurface }}
                >
                    {t("about.aboutTitle")}
                </Text>
                <Text
                    className="font-body text-[15px] leading-[23px]"
                    style={{ color: colors.onSurfaceVariant }}
                >
                    {t("about.aboutBody")}
                </Text>

                <View
                    className="mt-5 overflow-hidden rounded-2xl bg-white dark:bg-[#1A1D24]"
                    style={{
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: 0.05,
                        shadowRadius: 4,
                        elevation: 2,
                    }}
                >
                    <AboutItem
                        icon={MapPinned}
                        title={t("about.mapTitle")}
                        description={t("about.mapBody")}
                    />
                    <Divider />
                    <AboutItem
                        icon={ClipboardCheck}
                        title={t("about.moderationTitle")}
                        description={t("about.moderationBody")}
                    />
                    <Divider />
                    <AboutItem
                        icon={ShieldCheck}
                        title={t("about.sourcesTitle")}
                        description={t("about.sourcesBody")}
                    />
                </View>

                <View className="mt-5 flex-row gap-3 rounded-2xl border border-[#F3D28C] dark:border-[#4A3B1A] bg-[#FFF8E8] dark:bg-[#2B2313] p-4">
                    <View className="mt-0.5">
                        <ShieldAlert
                            size={22}
                            color={colors.warning}
                            strokeWidth={2}
                        />
                    </View>
                    <View className="flex-1 gap-1">
                        <Text className="text-[15px] font-body-semibold" style={{ color: colors.onWarningContainer }}>
                            {t("about.responsibilityTitle")}
                        </Text>
                        <Text className="font-body text-[14px] leading-[21px]" style={{ color: colors.onWarningContainer }}>
                            {t("about.responsibilityBody")}
                        </Text>
                    </View>
                </View>

                <Text
                    className="font-body mt-6 text-center text-[13px]"
                    style={{ color: colors.onSurfaceVariant }}
                >
                    {t("about.version", { version: String(version) })}
                </Text>
            </ScrollView>
        </View>
    );
}
