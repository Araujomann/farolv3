import Mapbox, { type MapState } from "@rnmapbox/maps";
import { useFocusEffect, useNavigation, useRouter } from "expo-router";
import {
    ArrowLeft,
    Check,
    CircleAlert,
    Crosshair,
    Expand,
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
    Alert,
    BackHandler,
    Pressable,
    Text,
    useWindowDimensions,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuthStore } from "@/src/store/authStore";
import { verifyEmailFromAppRoute } from "@/src/features/auth/verifyEmailRoute";

import { useAppTheme } from "@/src/theme/useAppTheme";
import { tr, useTranslation } from "@/src/i18n";
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
    const { t } = useTranslation();
    const { colors, isDark } = useAppTheme();
    const router = useRouter();
    const isEmailVerified = useAuthStore((state) =>
        Boolean(state.user?.is_email_verified),
    );
    const tabsNavigation = useNavigation("/(tabs)");
    const insets = useSafeAreaInsets();
    const { width, height } = useWindowDimensions();
    const cameraRef = useRef<Mapbox.Camera>(null);
    const [isMapExpanded, setIsMapExpanded] = useState(false);
    const [isConfirmed, setIsConfirmed] = useState(false);
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
        // Contas sem e-mail verificado só podem visualizar o mapa
        if (!isEmailVerified) {
            Alert.alert(
                tr("report.verifyTitle"),
                tr("report.verifyMessage"),
                [
                    { text: tr("report.notNow"), style: "cancel" },
                    {
                        text: tr("report.verifyNow"),
                        onPress: () => router.push(verifyEmailFromAppRoute),
                    },
                ],
            );
            return;
        }

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
        tabsNavigation.dispatch({
            type: "JUMP_TO",
            payload: { name: "map" },
        });
    }, [tabsNavigation]);

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
        <View className="flex-1 overflow-hidden bg-[#F1F3FE] dark:bg-[#242833]">
            <View
                className="absolute left-4 z-50"
                style={{ top: Math.max(insets.top, 16) }}
            >
                <Pressable
                    accessibilityLabel={t("report.back")}
                    onPress={handleBackPress}
                    className="h-11 w-11 items-center justify-center rounded-full bg-white dark:bg-[#1A1D24] shadow-md"
                >
                    <ArrowLeft size={22} color={colors.onSurface} />
                </Pressable>
            </View>

            <Animated.View
                className="absolute z-10 overflow-hidden border-white dark:border-[#1A1D24]"
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
                                lightPreset: isDark ? "night" : "day",
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
                                        borderColor: colors.surface,
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
                                            backgroundColor: colors.surface,
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
                        <View className="overflow-hidden rounded-xl border border-[#C1C6D7]/30 dark:border-[#3A3F4B]/30 bg-white/90 dark:bg-[#1A1D24]/90 shadow-lg">
                            <Pressable
                                accessibilityLabel={t("report.zoomIn")}
                                onPress={() =>
                                    cameraRef.current?.zoomTo(
                                        Math.min(20, zoomLevel + 1),
                                        250,
                                    )
                                }
                                className="border-b border-[#C1C6D7]/20 dark:border-[#3A3F4B]/20 p-2.5"
                            >
                                <Plus size={20} color={colors.onSurface} />
                            </Pressable>
                            <Pressable
                                accessibilityLabel={t("report.zoomOut")}
                                onPress={() =>
                                    cameraRef.current?.zoomTo(
                                        Math.max(3, zoomLevel - 1),
                                        250,
                                    )
                                }
                                className="p-2.5"
                            >
                                <Minus size={20} color={colors.onSurface} />
                            </Pressable>
                        </View>
                        <Pressable
                            accessibilityLabel={t("report.recenter")}
                            onPress={handleResetLocation}
                            className="h-10 w-10 items-center justify-center rounded-xl border border-[#C1C6D7]/30 dark:border-[#3A3F4B]/30 bg-white/90 dark:bg-[#1A1D24]/90 shadow-lg"
                        >
                            <Crosshair size={20} color={colors.onSurface} />
                        </Pressable>
                    </Animated.View>
            </Animated.View>

            <Animated.View
                className="absolute bottom-0 left-0 right-0 z-20 h-[40%] rounded-t-[32px] bg-white dark:bg-[#1A1D24] px-4 pt-6 shadow-lg"
                style={bottomSheetStyle}
                pointerEvents={isMapExpanded ? "none" : "auto"}
            >
                    <View className="mx-auto mb-6 h-1.5 w-12 rounded-full bg-[#717786]/40" />
                    <View className="flex-1 justify-between">
                        <View className="gap-4">
                            <Text className="text-center text-[22px] font-display text-[#181C23] dark:text-[#ECEEF4]">
                                {t("report.locationTitle")}
                            </Text>
                            <View className="flex-row items-center gap-2.5 rounded-2xl border border-[#ADC6FF]/30 bg-[#ADC6FF]/20 px-3 py-2.5">
                                <CircleAlert
                                    size={19}
                                    color={colors.primary}
                                    strokeWidth={2.25}
                                />
                                <Text className="font-body flex-1 text-[15px] leading-[20px] text-[#414755] dark:text-[#AAB0BD]">
                                    {t("report.locationHint")}
                                </Text>
                            </View>
                            <View className="flex-row items-center gap-2.5 rounded-2xl border border-[#ADC6FF]/30 bg-[#ADC6FF]/20 px-3 py-2.5">
                                <Expand
                                    size={19}
                                    color={colors.primary}
                                    strokeWidth={2.25}
                                />
                                <Text className="font-body flex-1 text-[15px] leading-[20px] text-[#414755] dark:text-[#AAB0BD]">
                                    {t("report.pinchHint")}
                                </Text>
                            </View>
                        </View>
                        <Pressable
                            accessibilityLabel={t("report.gotIt")}
                            onPress={() => setIsMapExpanded(true)}
                            className="h-14 items-center justify-center rounded-xl bg-[#0058BC] shadow-lg"
                            style={{
                                marginBottom: Math.max(insets.bottom + 16, 40),
                            }}
                        >
                            <Text className="text-[17px] font-body-bold text-white">
                                {t("report.gotIt")}
                            </Text>
                        </Pressable>
                    </View>
            </Animated.View>

            <Animated.View
                className="absolute bottom-5 left-4 right-4 z-30 gap-3"
                style={[confirmationStyle, { paddingBottom: Math.max(insets.bottom, 4) }]}
                pointerEvents={isMapExpanded ? "auto" : "none"}
            >
                    <View className="mx-auto flex-row items-center gap-6 rounded-full border border-[#717786]/30 bg-white/85 dark:bg-[#1A1D24]/85 px-5 py-2.5 shadow-md">
                        <Coordinate label={t("report.latitude")} value={selectedLocation[1]} />
                        <View className="h-6 w-px bg-[#717786]/40" />
                        <Coordinate
                            label={t("report.longitude")}
                            value={selectedLocation[0]}
                        />
                    </View>
                    <Pressable
                        accessibilityLabel={t("report.confirmLocationLabel")}
                        accessibilityState={{ disabled: isConfirmed }}
                        disabled={isConfirmed}
                        onPress={handleConfirmLocation}
                        className={`h-14 flex-row items-center justify-center gap-2 rounded-xl shadow-lg ${
                            isConfirmed ? "bg-[#16803C]" : "bg-[#0058BC]"
                        }`}
                    >
                        {isConfirmed && <Check size={21} color="#FFFFFF" />}
                        <Text className="text-[17px] font-body-bold text-white">
                            {isConfirmed
                                ? t("report.locationConfirmed")
                                : t("report.confirmLocation")}
                        </Text>
                    </Pressable>
            </Animated.View>

        </View>
    );
}

function Coordinate({ label, value }: { label: string; value: number }) {
    return (
        <View className="items-center">
            <Text className="mb-0.5 text-[10px] font-body-semibold uppercase tracking-wider text-[#717786] dark:text-[#8B92A1]">
                {label}
            </Text>
            <Text className="text-xs font-body-medium tabular-nums text-[#181C23] dark:text-[#ECEEF4]">
                {value.toFixed(6)}
            </Text>
        </View>
    );
}
