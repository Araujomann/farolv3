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

const PRIMARY_COLOR = "#0058BC";
const PAGE_COLOR = "#F2F2F7";
const TEXT_COLOR = "#181C23";
const MUTED_COLOR = "#626B7A";

type AboutScreenProps = {
    onClose: () => void;
};

type AboutItemProps = {
    icon: LucideIcon;
    title: string;
    description: string;
};

function AboutItem({ icon: Icon, title, description }: AboutItemProps) {
    return (
        <View className="flex-row gap-3 px-4 py-4">
            <View className="h-10 w-10 items-center justify-center rounded-xl bg-[#EAF1FC]">
                <Icon size={21} color={PRIMARY_COLOR} strokeWidth={2} />
            </View>
            <View className="flex-1 gap-1">
                <Text className="text-[15px] font-semibold" style={{ color: TEXT_COLOR }}>
                    {title}
                </Text>
                <Text className="text-[14px] leading-[21px]" style={{ color: MUTED_COLOR }}>
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
    const insets = useSafeAreaInsets();
    const version = Constants.expoConfig?.version ?? "—";

    return (
        <View className="flex-1" style={{ backgroundColor: PAGE_COLOR }}>
            <View
                className="flex-row items-center px-4"
                style={{
                    backgroundColor: "#FFFFFF",
                    paddingTop: insets.top + 4,
                    height: 56 + insets.top,
                }}
            >
                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Fechar sobre o app"
                    onPress={onClose}
                    hitSlop={8}
                    className="h-11 w-11 items-center justify-center"
                >
                    <ArrowLeft size={24} color={PRIMARY_COLOR} strokeWidth={2} />
                </Pressable>
                <Text
                    className="flex-1 text-center text-lg font-semibold"
                    style={{ color: TEXT_COLOR, marginRight: 44 }}
                >
                    Sobre o app
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
                <View className="items-center rounded-2xl bg-white px-6 py-7">
                    <Image
                        source={require("../../../../assets/images/splash-new-icon.png")}
                        accessibilityLabel="Símbolo do Farol"
                        className="h-[76px] w-[76px] rounded-2xl"
                    />
                    <Text className="mt-4 text-[26px] font-bold" style={{ color: TEXT_COLOR }}>
                        Farol
                    </Text>
                    <Text
                        className="mt-2 text-center text-[15px] leading-[22px]"
                        style={{ color: MUTED_COLOR }}
                    >
                        Informação para seguir com mais atenção e consciência no trânsito.
                    </Text>
                </View>

                <Text
                    className="mb-2 mt-6 text-[17px] font-bold"
                    style={{ color: TEXT_COLOR }}
                >
                    Sobre o Farol
                </Text>
                <Text
                    className="text-[15px] leading-[23px]"
                    style={{ color: MUTED_COLOR }}
                >
                    O Farol reúne informações sobre ocorrências no trânsito para
                    ajudar você a consultar o mapa e compartilhar relatos de forma
                    responsável. A proposta é ampliar o acesso à informação e
                    incentivar uma cultura de mais atenção nas vias.
                </Text>

                <View
                    className="mt-5 overflow-hidden rounded-2xl bg-white"
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
                        title="Informação no mapa"
                        description="Consulte ocorrências de diferentes fontes, incluindo dados oficiais da PRF e relatos enviados pela comunidade."
                    />
                    <Divider />
                    <AboutItem
                        icon={ClipboardCheck}
                        title="Relatos com moderação"
                        description="Os relatos enviados pelo app passam por análise antes de aparecerem no mapa público. Você pode acompanhar o status em Meus Relatos."
                    />
                    <Divider />
                    <AboutItem
                        icon={ShieldCheck}
                        title="Fontes identificadas"
                        description="Os registros são apresentados com sua origem, para ajudar você a entender de onde vêm as informações."
                    />
                </View>

                <View className="mt-5 flex-row gap-3 rounded-2xl border border-[#F3D28C] bg-[#FFF8E8] p-4">
                    <View className="mt-0.5">
                        <ShieldAlert
                            size={22}
                            color="#9B6500"
                            strokeWidth={2}
                        />
                    </View>
                    <View className="flex-1 gap-1">
                        <Text className="text-[15px] font-semibold" style={{ color: "#704800" }}>
                            Use com responsabilidade
                        </Text>
                        <Text className="text-[14px] leading-[21px]" style={{ color: "#704800" }}>
                            O Farol é informativo e não substitui os canais oficiais
                            de emergência. Em uma emergência em rodovia federal,
                            acione a PRF pelo 191. Consulte ou envie informações
                            somente quando estiver em segurança.
                        </Text>
                    </View>
                </View>

                <Text
                    className="mt-6 text-center text-[13px]"
                    style={{ color: MUTED_COLOR }}
                >
                    Farol · Versão {version}
                </Text>
            </ScrollView>
        </View>
    );
}
