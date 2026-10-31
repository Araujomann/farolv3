import Mapbox, { type MapState } from "@rnmapbox/maps";
import { useFocusEffect, useRouter } from "expo-router";
import {
    ArrowLeft,
    Check,
    CircleAlert,
    Crosshair,
    Expand,
    X,
    Minus,
    Plus,
} from "lucide-react-native";
import Animated, {
    Easing,
    interpolate,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from "react-native-reanimated";
import { useCallback, useEffect, useRef, useState } from "react";
import {
    BackHandler,
    Modal,
    Pressable,
    Text,
    useWindowDimensions,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const DEFAULT_CENTER: [number, number] = [-47.47812, -5.52693];
const INITIAL_ZOOM = 15;
const EXPANSION_DURATION = 600;
const mapStyle = {
    version: 8,
    imports: [
        {
            id: "basemap",
            url: "mapbox://styles/mapbox/standard",
        },
    ],
} as const;

export default function ReportScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { width, height } = useWindowDimensions();
    const cameraRef = useRef<Mapbox.Camera>(null);
    const [isMapExpanded, setIsMapExpanded] = useState(false);
    const [isConfirmed, setIsConfirmed] = useState(false);
    const [isExitDialogVisible, setIsExitDialogVisible] = useState(false);
    const [selectedLocation, setSelectedLocation] =
        useState<[number, number]>(DEFAULT_CENTER);
    const [zoomLevel, setZoomLevel] = useState(INITIAL_ZOOM);
    const expansionProgress = useSharedValue(0);
    const initialMapSize = Math.min(width - 32, height * 0.52);
    const initialMapTop = Math.max(insets.top + 32, 56);
    const lastCameraUpdateRef = useRef(0);
    const isConfirmedRef = useRef(false);
    const confirmationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
        null,
    );

    const handleCameraChanged = useCallback((state: MapState) => {
        const now = Date.now();

        // Mapbox emits this event every frame while the map is moving.
        // Keep the map gesture native and update only the visible readout.
        if (now - lastCameraUpdateRef.current < 80) {
            return;
        }

        const [longitude, latitude] = state.properties.center;

        if (typeof longitude !== "number" || typeof latitude !== "number") {
            return;
        }

        lastCameraUpdateRef.current = now;
        setSelectedLocation([longitude, latitude]);

        if (isConfirmedRef.current) {
            isConfirmedRef.current = false;
            setIsConfirmed(false);
        }

        if (typeof state.properties.zoom === "number") {
            setZoomLevel(state.properties.zoom);
        }
    }, []);

    const handleResetLocation = () => {
        cameraRef.current?.flyTo(DEFAULT_CENTER, 700);
        setSelectedLocation(DEFAULT_CENTER);
        setZoomLevel(INITIAL_ZOOM);
        isConfirmedRef.current = false;
        setIsConfirmed(false);
    };

    const handleConfirmLocation = () => {
        isConfirmedRef.current = true;
        setIsConfirmed(true);

        confirmationTimeoutRef.current = setTimeout(() => {
            router.push({
                pathname: "/report/form",
                params: {
                    longitude: selectedLocation[0].toString(),
                    latitude: selectedLocation[1].toString(),
                },
            });
        }, 1200);
    };

    const handleBackPress = useCallback(() => {
        setIsExitDialogVisible(true);
    }, []);

    useFocusEffect(
        useCallback(() => {
            const subscription = BackHandler.addEventListener(
                "hardwareBackPress",
                () => {
                    handleBackPress();
                    return true;
                },
            );

            return () => subscription.remove();
        }, [handleBackPress]),
    );

    const handleExitReport = () => {
        setIsExitDialogVisible(false);

        if (router.canGoBack()) {
            router.back();
        } else {
            router.navigate("/map");
        }
    };

    useEffect(() => {
        expansionProgress.value = withTiming(isMapExpanded ? 1 : 0, {
            duration: EXPANSION_DURATION,
            easing: Easing.bezier(0.22, 1, 0.36, 1),
        });
    }, [expansionProgress, isMapExpanded]);

    useEffect(() => {
        return () => {
            lastCameraUpdateRef.current = 0;
            if (confirmationTimeoutRef.current) {
                clearTimeout(confirmationTimeoutRef.current);
            }
        };
    }, []);

    const mapWrapperStyle = useAnimatedStyle(() => ({
        top: interpolate(
            expansionProgress.value,
            [0, 1],
            [initialMapTop, 0],
        ),
        left: interpolate(expansionProgress.value, [0, 1], [16, 0]),
        width: interpolate(
            expansionProgress.value,
            [0, 1],
            [initialMapSize, width],
        ),
        height: interpolate(
            expansionProgress.value,
            [0, 1],
            [initialMapSize, height],
        ),
        borderRadius: interpolate(
            expansionProgress.value,
            [0, 1],
            [initialMapSize / 2, 0],
        ),
        borderWidth: interpolate(expansionProgress.value, [0, 1], [4, 0]),
    }));

    const bottomSheetStyle = useAnimatedStyle(() => ({
        opacity: interpolate(expansionProgress.value, [0, 0.35, 1], [1, 0.8, 0]),
        transform: [
            {
                translateY: interpolate(
                    expansionProgress.value,
                    [0, 1],
                    [0, height * 0.42],
                ),
            },
        ],
    }));

    const expandedControlsStyle = useAnimatedStyle(() => ({
        opacity: interpolate(expansionProgress.value, [0, 0.65, 1], [0, 0.2, 1]),
        transform: [
            {
                translateY: interpolate(
                    expansionProgress.value,
                    [0, 1],
                    [12, 0],
                ),
            },
        ],
    }));

    const confirmationStyle = useAnimatedStyle(() => ({
        opacity: interpolate(expansionProgress.value, [0, 0.7, 1], [0, 0.2, 1]),
        transform: [
            {
                translateY: interpolate(
                    expansionProgress.value,
                    [0, 1],
                    [28, 0],
                ),
            },
        ],
    }));

    return (
        <View className="flex-1 overflow-hidden bg-[#F1F3FE]">
            <View
                className="absolute left-4 z-50"
                style={{ top: Math.max(insets.top, 16) }}
            >
                <Pressable
                    accessibilityLabel="Voltar"
                    onPress={handleBackPress}
                    className="h-11 w-11 items-center justify-center rounded-full bg-white shadow-md"
                >
                    <ArrowLeft size={22} color="#181C23" />
                </Pressable>
            </View>

            <Animated.View
                className="absolute z-10 overflow-hidden border-white"
                style={mapWrapperStyle}
            >
                    <Mapbox.MapView
                        style={{ flex: 1 }}
                        styleJSON={JSON.stringify(mapStyle)}
                        onCameraChanged={handleCameraChanged}
                        attributionPosition={{ bottom: 8, right: 8 }}
                        compassEnabled={false}
                        logoPosition={{ bottom: 8, left: 8 }}
                    >
                        <Mapbox.StyleImport
                            id="basemap"
                            existing
                            config={{
                                lightPreset: "day",
                                theme: "default",
                                font: "DIN Pro",
                                showTransitLabels: true,
                                show3dObjects: true,
                                show3dBuildings: true,
                                show3dTrees: true,
                                show3dFacades: true,
                                show3dLandmarks: true,
                            }}
                        />
                        <Mapbox.Camera
                            ref={cameraRef}
                            defaultSettings={{
                                centerCoordinate: DEFAULT_CENTER,
                                zoomLevel: INITIAL_ZOOM,
                            }}
                        />
                    </Mapbox.MapView>

                    <View
                        pointerEvents="none"
                        className="absolute inset-0 items-center justify-center"
                    >
                        <View className="-mt-2 items-center">
                            <View
                                style={{
                                    width: 34,
                                    height: 40,
                                    alignItems: "center",
                                    justifyContent: "flex-start",
                                }}
                            >
                                <View
                                    style={{
                                        width: 29,
                                        height: 29,
                                        alignItems: "center",
                                        justifyContent: "center",
                                        backgroundColor: "#FF3B30",
                                        borderWidth: 3,
                                        borderColor: "#FFFFFF",
                                        borderRadius: 18,
                                        borderBottomRightRadius: 6,
                                        transform: [{ rotate: "45deg" }],
                                        shadowColor: "#000000",
                                        shadowOffset: { width: 0, height: 4 },
                                        shadowOpacity: 0.38,
                                        shadowRadius: 5,
                                        elevation: 7,
                                    }}
                                >
                                    <View
                                        style={{
                                            width: 8,
                                            height: 8,
                                            borderRadius: 4,
                                            backgroundColor: "#FFFFFF",
                                            transform: [{ rotate: "-45deg" }],
                                        }}
                                    />
                                </View>
                            </View>
                            <View className="-mt-2 h-3.5 w-4 rounded-full bg-black/35" />
                        </View>
                    </View>

                    <Animated.View
                        className="absolute bottom-4 right-4 gap-2"
                        style={expandedControlsStyle}
                        pointerEvents={isMapExpanded ? "auto" : "none"}
                    >
                        <View className="overflow-hidden rounded-xl border border-[#C1C6D7]/30 bg-white/90 shadow-lg">
                            <Pressable
                                accessibilityLabel="Aumentar zoom"
                                onPress={() =>
                                    cameraRef.current?.zoomTo(
                                        Math.min(20, zoomLevel + 1),
                                        250,
                                    )
                                }
                                className="border-b border-[#C1C6D7]/20 p-2.5"
                            >
                                <Plus size={20} color="#181C23" />
                            </Pressable>
                            <Pressable
                                accessibilityLabel="Reduzir zoom"
                                onPress={() =>
                                    cameraRef.current?.zoomTo(
                                        Math.max(3, zoomLevel - 1),
                                        250,
                                    )
                                }
                                className="p-2.5"
                            >
                                <Minus size={20} color="#181C23" />
                            </Pressable>
                        </View>
                        <Pressable
                            accessibilityLabel="Recentrar mapa"
                            onPress={handleResetLocation}
                            className="h-10 w-10 items-center justify-center rounded-xl border border-[#C1C6D7]/30 bg-white/90 shadow-lg"
                        >
                            <Crosshair size={20} color="#181C23" />
                        </Pressable>
                    </Animated.View>
            </Animated.View>

            <Animated.View
                className="absolute bottom-0 left-0 right-0 z-20 h-[40%] rounded-t-[32px] bg-white px-4 pt-6 shadow-lg"
                style={bottomSheetStyle}
                pointerEvents={isMapExpanded ? "none" : "auto"}
            >
                    <View className="mx-auto mb-6 h-1.5 w-12 rounded-full bg-[#717786]/40" />
                    <View className="flex-1 justify-between">
                        <View className="gap-4">
                            <Text className="text-center text-[22px] font-bold text-[#181C23]">
                                Local do Acidente
                            </Text>
                            <View className="flex-row items-center gap-2.5 rounded-2xl border border-[#ADC6FF]/30 bg-[#ADC6FF]/20 px-3 py-2.5">
                                <CircleAlert
                                    size={19}
                                    color="#0058BC"
                                    strokeWidth={2.25}
                                />
                                <Text className="flex-1 text-[15px] leading-[20px] text-[#414755]">
                                    Arraste o mapa até que o pino esteja sobre o
                                    local exato do acidente.
                                </Text>
                            </View>
                            <View className="flex-row items-center gap-2.5 rounded-2xl border border-[#ADC6FF]/30 bg-[#ADC6FF]/20 px-3 py-2.5">
                                <Expand
                                    size={19}
                                    color="#0058BC"
                                    strokeWidth={2.25}
                                />
                                <Text className="flex-1 text-[15px] leading-[20px] text-[#414755]">
                                    Use pinça para ajustar o zoom.
                                </Text>
                            </View>
                        </View>
                        <Pressable
                            accessibilityLabel="Entendi"
                            onPress={() => setIsMapExpanded(true)}
                            className="h-14 items-center justify-center rounded-xl bg-[#0058BC] shadow-lg"
                            style={{
                                marginBottom: Math.max(insets.bottom + 16, 40),
                            }}
                        >
                            <Text className="text-[17px] font-bold text-white">
                                Entendi
                            </Text>
                        </Pressable>
                    </View>
            </Animated.View>

            <Animated.View
                className="absolute bottom-5 left-4 right-4 z-30 gap-3"
                style={[confirmationStyle, { paddingBottom: Math.max(insets.bottom, 4) }]}
                pointerEvents={isMapExpanded ? "auto" : "none"}
            >
                    <View className="mx-auto flex-row items-center gap-6 rounded-full border border-[#717786]/30 bg-white/85 px-5 py-2.5 shadow-md">
                        <Coordinate label="Latitude" value={selectedLocation[1]} />
                        <View className="h-6 w-px bg-[#717786]/40" />
                        <Coordinate
                            label="Longitude"
                            value={selectedLocation[0]}
                        />
                    </View>
                    <Pressable
                        accessibilityLabel="Confirmar localização"
                        accessibilityState={{ disabled: isConfirmed }}
                        disabled={isConfirmed}
                        onPress={handleConfirmLocation}
                        className={`h-14 flex-row items-center justify-center gap-2 rounded-xl shadow-lg ${
                            isConfirmed ? "bg-[#16803C]" : "bg-[#0058BC]"
                        }`}
                    >
                        {isConfirmed && <Check size={21} color="#FFFFFF" />}
                        <Text className="text-[17px] font-bold text-white">
                            {isConfirmed
                                ? "Localização confirmada"
                                : "Confirmar Localização"}
                        </Text>
                    </Pressable>
            </Animated.View>

            <Modal
                visible={isExitDialogVisible}
                transparent
                animationType="fade"
                statusBarTranslucent
                navigationBarTranslucent
                onRequestClose={() => setIsExitDialogVisible(false)}
            >
                <View className="flex-1 items-center justify-center bg-black/45 px-5">
                    <View className="w-full max-w-[390px] rounded-[28px] bg-white p-5 shadow-2xl">
                        <View className="mb-5 flex-row items-start justify-between">
                            <View className="flex-1 flex-row items-center gap-3 pr-4">
                                <View className="h-11 w-11 items-center justify-center rounded-full bg-[#FFF1E8]">
                                    <CircleAlert
                                        size={24}
                                        color="#C64F00"
                                        strokeWidth={2.25}
                                    />
                                </View>
                                <Text className="flex-1 text-[20px] font-bold text-[#181C23]">
                                    Sair do relatório?
                                </Text>
                            </View>
                            <Pressable
                                accessibilityLabel="Fechar confirmação"
                                onPress={() => setIsExitDialogVisible(false)}
                                className="h-9 w-9 items-center justify-center rounded-full bg-[#F1F3FE]"
                            >
                                <X size={18} color="#414755" />
                            </Pressable>
                        </View>

                        <Text className="mb-6 text-[15px] leading-[21px] text-[#414755]">
                            Se você sair agora, perderá o progresso deste relatório. Deseja sair mesmo assim?
                        </Text>

                        <View className="gap-2.5">
                            <Pressable
                                accessibilityLabel="Continuar no relato"
                                onPress={() => setIsExitDialogVisible(false)}
                                className="h-12 items-center justify-center rounded-xl bg-[#0058BC]"
                            >
                                <Text className="text-[15px] font-bold text-white">
                                    Continuar preenchendo
                                </Text>
                            </Pressable>
                            <Pressable
                                accessibilityLabel="Sair mesmo assim"
                                onPress={handleExitReport}
                                className="h-12 items-center justify-center rounded-xl border border-[#F0B7A8] bg-[#FFF8F5]"
                            >
                                <Text className="text-[15px] font-bold text-[#B42318]">
                                    Sair mesmo assim
                                </Text>
                            </Pressable>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

function Coordinate({ label, value }: { label: string; value: number }) {
    return (
        <View className="items-center">
            <Text className="mb-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#717786]">
                {label}
            </Text>
            <Text className="text-xs font-medium tabular-nums text-[#181C23]">
                {value.toFixed(6)}
            </Text>
        </View>
    );
}
