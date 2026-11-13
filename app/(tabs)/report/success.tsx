import { useCallback, useEffect, useRef } from "react";
import Animated, {
    Easing,
    interpolate,
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming,
} from "react-native-reanimated";
import {
    Pressable,
    ScrollView,
    Text,
    useWindowDimensions,
    View,
} from "react-native";
import { ArrowLeft, ArrowRight } from "lucide-react-native";
import { useNavigation } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const GREEN = "#34C759";
const GRAY = "#9CA3AF";
const PRIMARY = "#0058BC";

export default function ReportSuccessScreen() {
    const navigation = useNavigation();
    const tabsNavigation = useNavigation("/(tabs)");
    const insets = useSafeAreaInsets();
    const { width } = useWindowDimensions();

    const introProgress = useSharedValue(0);
    const ambientProgress = useSharedValue(0);
    const exitProgress = useSharedValue(0);
    const isExiting = useRef(false);

    useEffect(() => {
        introProgress.value = withTiming(1, {
            duration: 800,
            easing: Easing.out(Easing.cubic),
        });

        ambientProgress.value = withRepeat(
            withTiming(1, {
                duration: 4200,
                easing: Easing.inOut(Easing.sin),
            }),
            -1,
            true,
        );
    }, [ambientProgress, introProgress]);

    const navigateHome = useCallback(() => {
        navigation.dispatch({ type: "POP_TO_TOP" });
        tabsNavigation.dispatch({
            type: "JUMP_TO",
            payload: { name: "home" },
        });
    }, [navigation, tabsNavigation]);

    // Mantém a transição suave ao voltar ao início.
    const returnHome = useCallback(() => {
        if (isExiting.current) return;

        isExiting.current = true;

        exitProgress.value = withTiming(
            1,
            {
                duration: 420,
                easing: Easing.inOut(Easing.cubic),
            },
            (finished) => {
                if (finished) {
                    runOnJS(navigateHome)();
                }
            },
        );
    }, [exitProgress, navigateHome]);

    const exitStyle = useAnimatedStyle(() => ({
        opacity: interpolate(exitProgress.value, [0, 1], [1, 0]),
        transform: [
            {
                translateY: interpolate(exitProgress.value, [0, 1], [0, -14]),
            },
        ],
    }));

    // Movimento dos círculos verdes.
    const glowStyle = useAnimatedStyle(() => ({
        opacity: interpolate(introProgress.value, [0, 1], [0, 0.075]),
        transform: [
            {
                translateX: interpolate(
                    introProgress.value,
                    [0, 1],
                    [width * 0.16, 0],
                ),
            },
            {
                translateY: interpolate(ambientProgress.value, [0, 1], [0, 12]),
            },
            {
                scale: interpolate(ambientProgress.value, [0, 1], [1, 1.035]),
            },
        ],
    }));

    // Novo círculo cinza: menor e com movimento complementar ao verde.
    const grayGlowStyle = useAnimatedStyle(() => ({
        opacity: interpolate(introProgress.value, [0, 1], [0, 0.16]),
        transform: [
            {
                translateX: interpolate(ambientProgress.value, [0, 1], [-6, 8]),
            },
            {
                translateY: interpolate(ambientProgress.value, [0, 1], [10, -12]),
            },
            {
                scale: interpolate(ambientProgress.value, [0, 1], [1.04, 1]),
            },
        ],
    }));

    const contentStyle = useAnimatedStyle(() => ({
        opacity: interpolate(introProgress.value, [0, 1], [0, 1]),
        transform: [
            {
                translateY: interpolate(introProgress.value, [0, 1], [24, 0]),
            },
        ],
    }));

    const orbSize = width * 1.22;
    const graySize = Math.min(width * 0.68, 290);
    const heroSize = 156;

    return (
        <View style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
            <Animated.View
                style={[
                    {
                        flex: 1,
                        overflow: "hidden",
                        backgroundColor: "#FFFFFF",
                    },
                    exitStyle,
                ]}
            >
                {/* Círculo verde decorativo inferior */}
                <Animated.View
                    pointerEvents="none"
                    style={[
                        {
                            position: "absolute",
                            bottom: orbSize * 0.32,
                            left: orbSize * 0.55,
                            width: orbSize,
                            height: orbSize,
                            borderRadius: orbSize / 2,
                            backgroundColor: GREEN,
                        },
                        glowStyle,
                    ]}
                />

                {/* Novo círculo cinza no canto inferior esquerdo */}
                <Animated.View
                    pointerEvents="none"
                    style={[
                        {
                            position: "absolute",
                            bottom: insets.bottom + 92,
                            left: -graySize * 0.35,
                            width: graySize,
                            height: graySize,
                            borderRadius: graySize / 2,
                            backgroundColor: GRAY,
                        },
                        grayGlowStyle,
                    ]}
                />

                {/* Círculo verde superior animado */}
                <View
                    pointerEvents="none"
                    style={{
                        position: "absolute",
                        top: insets.top + 58,
                        right: width * 0.055,
                        width: heroSize,
                        height: heroSize,
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 1,
                    }}
                >
                    <Animated.View
                        style={[
                            {
                                position: "absolute",
                                top: (heroSize - orbSize) / 2,
                                left: (heroSize - orbSize) / 2,
                                width: orbSize,
                                height: orbSize,
                                borderRadius: orbSize / 2,
                                backgroundColor: GREEN,
                            },
                            glowStyle,
                        ]}
                    />
                </View>

                {/* Botão superior de voltar */}
                <Pressable
                    accessibilityLabel="Voltar para o início"
                    accessibilityRole="button"
                    onPress={returnHome}
                    style={({ pressed }) => ({
                        position: "absolute",
                        zIndex: 2,
                        top: insets.top + 12,
                        left: 16,
                        width: 48,
                        height: 48,
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: 24,
                        backgroundColor: "rgba(224, 226, 237, 0.62)",
                        opacity: pressed ? 0.72 : 1,
                        transform: [{ scale: pressed ? 0.96 : 1 }],
                    })}
                >
                    <ArrowLeft size={22} color="#181C23" strokeWidth={2.2} />
                </Pressable>

                {/* Texto decorativo para telas maiores */}
                {width >= 500 && (
                    <Text
                        accessibilityElementsHidden
                        importantForAccessibility="no"
                        style={{
                            position: "absolute",
                            left: -38,
                            top: "38%",
                            color: "rgba(24,28,35,0.1)",
                            fontSize: 92,
                            fontFamily: "PlusJakartaSans_700Bold",
                            transform: [{ rotate: "-90deg" }],
                        }}
                    >
                        Enviado!
                    </Text>
                )}

                {/* Conteúdo principal */}
                <ScrollView
                    style={{ flex: 1 }}
                    contentContainerStyle={{
                        flexGrow: 1,
                        justifyContent: "flex-end",
                        alignItems: "center",
                        paddingHorizontal: 24,
                        paddingTop: insets.top + 130,
                        paddingBottom: insets.bottom + 112,
                    }}
                    showsVerticalScrollIndicator={false}
                >
                    <Animated.View
                        style={[
                            contentStyle,
                            {
                                width: "100%",
                                maxWidth: 520,
                                alignSelf: "center",
                            },
                        ]}
                    >
                        <View
                            style={{
                                width: "100%",
                                padding: 20,
                                borderLeftWidth: 3,
                                borderLeftColor: PRIMARY,
                                borderRadius: 20,
                                backgroundColor: "#F8F9FF",
                                shadowColor: "#181C23",
                                shadowOffset: { width: 0, height: 12 },
                                shadowOpacity: 0.08,
                                shadowRadius: 24,
                                elevation: 5,
                            }}
                        >
                            <Text
                                accessibilityRole="header"
                                style={{
                                    marginBottom: 12,
                                    color: "#181C23",
                                    fontSize: 40,
                                    fontFamily: "PlusJakartaSans_700Bold",
                                    lineHeight: 46,
                                }}
                            >
                                Relato{"\n"}Enviado!
                            </Text>

                            <Text className="font-body"
                                style={{
                                    width: "100%",
                                    color: "#414755",
                                    fontSize: 17,
                                    lineHeight: 25,
                                    flexShrink: 1,
                                }}
                            >
                                Seu relato foi enviado com sucesso e será analisado
                                pela nossa equipe. Agradecemos pela contribuição para uma
                                cidade mais segura!
                            </Text>
                        </View>
                    </Animated.View>
                </ScrollView>

                {/* Botão inferior */}
                <View
                    style={{
                        paddingHorizontal: 24,
                        paddingTop: 12,
                        paddingBottom: insets.bottom + 24,
                        backgroundColor: "#FFFFFF",
                    }}
                >
                    <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Voltar para o Início"
                        onPress={returnHome}
                        style={({ pressed }) => ({
                            height: 64,
                            flexDirection: "row",
                            alignItems: "center",
                            justifyContent: "space-between",
                            borderRadius: 32,
                            backgroundColor: PRIMARY,
                            paddingHorizontal: 28,
                            opacity: pressed ? 0.9 : 1,
                            transform: [{ scale: pressed ? 0.98 : 1 }],
                            shadowColor: PRIMARY,
                            shadowOffset: { width: 0, height: 8 },
                            shadowOpacity: 0.3,
                            shadowRadius: 18,
                            elevation: 8,
                        })}
                    >
                        <Text
                            numberOfLines={1}
                            style={{
                                flex: 1,
                                marginRight: 12,
                                color: "#FFFFFF",
                                fontSize: 17,
                                fontFamily: "Inter_700Bold",
                            }}
                        >
                            Voltar para o Início
                        </Text>

                        <View
                            style={{
                                width: 36,
                                height: 36,
                                alignItems: "center",
                                justifyContent: "center",
                                borderRadius: 18,
                                backgroundColor: "rgba(255,255,255,0.2)",
                            }}
                        >
                            <ArrowRight
                                size={20}
                                color="#FFFFFF"
                                strokeWidth={2.5}
                            />
                        </View>
                    </Pressable>
                </View>
            </Animated.View>
        </View>
    );
}
