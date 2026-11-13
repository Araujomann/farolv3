import { Bell, RefreshCw, X } from "lucide-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Animated,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    useWindowDimensions,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text } from "@/components/ui/text";
import {
    getAdministrativeNotices,
    type AdministrativeNotice,
} from "@/src/api/notifications";

const PRIMARY_HEX = "#0058BC";
const INK_HEX = "#181C23";
const MUTED_HEX = "#596273";
const PANEL_MAX_WIDTH = 440;

type AdministrativeNoticesPanelProps = {
    isVisible: boolean;
    onClose: () => void;
    titleColor: string;
};

function formatNoticeDate(value: string) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return "Data indisponível";
    }

    return date.toLocaleString("pt-BR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

export function AdministrativeNoticesPanel({
    isVisible,
    onClose,
    titleColor,
}: AdministrativeNoticesPanelProps) {
    const insets = useSafeAreaInsets();
    const { width } = useWindowDimensions();
    const panelWidth = Math.min(width * 0.9, PANEL_MAX_WIDTH);
    const translateX = useRef(new Animated.Value(panelWidth)).current;
    const backdropOpacity = useRef(new Animated.Value(0)).current;
    const requestId = useRef(0);
    const isClosing = useRef(false);
    const [notices, setNotices] = useState<AdministrativeNotice[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadNotices = useCallback(async () => {
        const currentRequestId = ++requestId.current;
        setIsLoading(true);
        setError(null);

        try {
            const result = await getAdministrativeNotices();
            if (currentRequestId === requestId.current) {
                setNotices(result);
            }
        } catch (reason) {
            if (__DEV__) {
                console.warn("Falha ao carregar os avisos administrativos", reason);
            }
            if (currentRequestId === requestId.current) {
                setError(
                    "Não foi possível carregar os avisos. Verifique a conexão e tente novamente.",
                );
            }
        } finally {
            if (currentRequestId === requestId.current) {
                setIsLoading(false);
            }
        }
    }, []);

    useEffect(() => {
        if (!isVisible) {
            return;
        }

        isClosing.current = false;
        translateX.setValue(panelWidth);
        backdropOpacity.setValue(0);
        Animated.parallel([
            Animated.timing(translateX, {
                toValue: 0,
                duration: 250,
                useNativeDriver: true,
            }),
            Animated.timing(backdropOpacity, {
                toValue: 1,
                duration: 200,
                useNativeDriver: true,
            }),
        ]).start();
        void loadNotices();
    }, [backdropOpacity, isVisible, loadNotices, panelWidth, translateX]);

    const handleClose = useCallback(() => {
        if (isClosing.current) {
            return;
        }

        isClosing.current = true;
        Animated.parallel([
            Animated.timing(translateX, {
                toValue: panelWidth,
                duration: 220,
                useNativeDriver: true,
            }),
            Animated.timing(backdropOpacity, {
                toValue: 0,
                duration: 180,
                useNativeDriver: true,
            }),
        ]).start(({ finished }) => {
            if (finished) {
                isClosing.current = false;
                onClose();
            }
        });
    }, [backdropOpacity, onClose, panelWidth, translateX]);

    return (
        <Modal
            animationType="none"
            onRequestClose={handleClose}
            statusBarTranslucent
            transparent
            visible={isVisible}
        >
            <View className="flex-1 flex-row justify-end">
                <Animated.View
                    pointerEvents="box-none"
                    style={[
                        StyleSheet.absoluteFillObject,
                        { opacity: backdropOpacity },
                    ]}
                >
                    <Pressable
                        accessibilityLabel="Fechar avisos"
                        accessibilityRole="button"
                        onPress={handleClose}
                        style={styles.backdrop}
                    />
                </Animated.View>

                <Animated.View
                    accessibilityViewIsModal
                    className="bg-white"
                    style={[
                        styles.panel,
                        {
                            width: panelWidth,
                            paddingTop: insets.top,
                            transform: [{ translateX }],
                        },
                    ]}
                >
                    <View className="flex-row items-center justify-between border-b border-[#EDF0F5] px-5 pb-4 pt-3">
                        <View className="flex-1 flex-row items-center gap-3 pr-3">
                            <View className="h-11 w-11 items-center justify-center rounded-2xl bg-[#EAF1FF]">
                                <Bell size={22} color={titleColor} strokeWidth={2} />
                            </View>
                            <View className="flex-1">
                                <Text className="text-[19px] font-display" style={{ color: INK_HEX }}>
                                    Avisos 
                                </Text>
                                <Text className="font-body mt-0.5 text-[12px]" style={{ color: MUTED_HEX }}>
                                    Comunicados oficiais 
                                </Text>
                            </View>
                        </View>
                        <Pressable
                            accessibilityLabel="Fechar avisos"
                            accessibilityRole="button"
                            hitSlop={8}
                            onPress={handleClose}
                            className="h-10 w-10 items-center justify-center rounded-full bg-[#F3F5F9]"
                        >
                            <X size={20} color={MUTED_HEX} />
                        </Pressable>
                    </View>

                    <View className="flex-1">
                        <View className="flex-row items-center justify-between px-5 pb-3 pt-5">
                            <Text className="text-[13px] font-body-semibold" style={{ color: MUTED_HEX }}>
                                {notices.length === 1
                                    ? "1 aviso publicado"
                                    : `${notices.length} avisos publicados`}
                            </Text>
                            <Pressable
                                accessibilityLabel="Atualizar avisos"
                                accessibilityRole="button"
                                disabled={isLoading}
                                hitSlop={8}
                                onPress={() => void loadNotices()}
                                className="h-9 w-9 items-center justify-center rounded-full bg-[#F3F5F9]"
                            >
                                {isLoading ? (
                                    <ActivityIndicator size="small" color={PRIMARY_HEX} />
                                ) : (
                                    <RefreshCw size={17} color={PRIMARY_HEX} />
                                )}
                            </Pressable>
                        </View>

                        <ScrollView
                            contentContainerStyle={{
                                flexGrow: 1,
                                gap: 12,
                                paddingBottom: insets.bottom + 24,
                                paddingHorizontal: 16,
                            }}
                            showsVerticalScrollIndicator={false}
                        >
                            {isLoading && notices.length === 0 && (
                                <View className="flex-1 items-center justify-center gap-3 py-12">
                                    <ActivityIndicator size="large" color={PRIMARY_HEX} />
                                    <Text className="font-body text-sm" style={{ color: MUTED_HEX }}>
                                        Buscando os avisos mais recentes...
                                    </Text>
                                </View>
                            )}

                            {error && (
                                <View className="rounded-2xl border border-[#F0B7A8] bg-[#FFF8F5] p-4">
                                    <Text className="font-body text-sm leading-5" style={{ color: "#BA1A1A" }}>
                                        {error}
                                    </Text>
                                    <Pressable
                                        accessibilityRole="button"
                                        onPress={() => void loadNotices()}
                                        className="mt-3 self-start rounded-lg bg-white px-3 py-2"
                                    >
                                        <Text className="text-sm font-body-semibold" style={{ color: "#BA1A1A" }}>
                                            Tentar novamente
                                        </Text>
                                    </Pressable>
                                </View>
                            )}

                            {!isLoading && !error && notices.length === 0 && (
                                <View className="flex-1 items-center justify-center px-4 py-12">
                                    <View className="mb-4 h-16 w-16 items-center justify-center rounded-full bg-[#F1F5FC]">
                                        <Bell size={28} color="#7C8BA4" strokeWidth={1.7} />
                                    </View>
                                    <Text className="text-center text-base font-body-semibold" style={{ color: INK_HEX }}>
                                        Tudo em dia
                                    </Text>
                                    <Text className="font-body mt-2 text-center text-[13px] leading-5" style={{ color: MUTED_HEX }}>
                                        Quando a equipe publicar um comunicado, ele aparecerá aqui.
                                    </Text>
                                </View>
                            )}

                            {notices.map((notice) => (
                                <View
                                    key={notice.id}
                                    className="rounded-2xl border border-[#E6EAF2] bg-white p-4"
                                    style={styles.noticeCard}
                                >
                                    <View className="mb-3 flex-row items-center gap-2">
                                        <View className="h-2 w-2 rounded-full" style={{ backgroundColor: titleColor }} />
                                        <Text className="text-[12px] font-body-semibold" style={{ color: titleColor }}>
                                            Comunicado oficial
                                        </Text>
                                        <Text className="font-body ml-auto text-[11px]" style={{ color: "#7A8291" }}>
                                            {formatNoticeDate(notice.created_at)}
                                        </Text>
                                    </View>
                                    <Text className="font-body text-[14px] leading-[22px]" style={{ color: INK_HEX }}>
                                        {notice.message}
                                    </Text>
                                </View>
                            ))}
                        </ScrollView>
                    </View>
                </Animated.View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: "rgba(12, 19, 32, 0.46)",
    },
    panel: {
        alignSelf: "stretch",
        maxWidth: PANEL_MAX_WIDTH,
        elevation: 18,
        shadowColor: "#0C1320",
        shadowOffset: { width: -8, height: 0 },
        shadowOpacity: 0.18,
        shadowRadius: 18,
    },
    noticeCard: {
        shadowColor: "#12203A",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 1,
    },
});