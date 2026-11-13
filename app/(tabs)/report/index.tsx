
import Mapbox, { type MapState } from "@rnmapbox/maps";
import { useFocusEffect, useNavigation, useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import Animated from "react-native-reanimated";
import { useCallback, useEffect, useRef, useState } from "react";
import {
    Alert,
    BackHandler,
    Platform,
    Pressable,
    useWindowDimensions,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuthStore } from "@/src/store/authStore";
import { verifyEmailFromAppRoute } from "@/src/features/auth/verifyEmailRoute";
import { LocationConfirmation } from "@/src/features/report/components/location/LocationConfirmation";
import { LocationIntroSheet } from "@/src/features/report/components/location/LocationIntroSheet";
import { LocationPin } from "@/src/features/report/components/location/LocationPin";
import { MapZoomControls } from "@/src/features/report/components/location/MapZoomControls";
import { useLocationPickerAnimation } from "@/src/features/report/hooks/useLocationPickerAnimation";

import { useAppTheme } from "@/src/theme/useAppTheme";
import { tr, useTranslation } from "@/src/i18n";
import {
    BASEMAP_CONFIG,
    DEFAULT_CENTER,
    MAP_STYLE,
} from "@/src/features/map/constants/mapConfig";
const INITIAL_ZOOM = 15;

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
    const initialMapSize = Math.min(width - 32, height * 0.52);
    const initialMapTop = Math.max(insets.top + 32, 56);
    const {
        startExpansion,
        mapWrapperStyle,
        mapContentStyle,
        mapRingStyle,
        bottomSheetStyle,
        expandedControlsStyle,
        confirmationStyle,
    } = useLocationPickerAnimation({
        width,
        height,
        initialMapTop,
        initialMapSize,
    });
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

    const handleExpandMap = () => {
        startExpansion();
        setIsMapExpanded(true);
    };

    useEffect(() => {
        return () => {
            lastCameraUpdateRef.current = 0;
            if (confirmationTimeoutRef.current) {
                clearTimeout(confirmationTimeoutRef.current);
            }
        };
    }, []);

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
                className="absolute z-10 overflow-hidden"
                style={mapWrapperStyle}
            >
                <Animated.View
                    style={[
                        { position: "absolute", top: 0, left: 0, width, height },
                        mapContentStyle,
                    ]}
                >
                    <Mapbox.MapView
                        style={{ flex: 1 }}
                        // TextureView respeita o recorte arredondado e as
                        // transformações do pai; SurfaceView "vaza" no Android.
                        surfaceView={Platform.OS === "android" ? false : undefined}
                        styleJSON={JSON.stringify(MAP_STYLE)}
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
                                ...BASEMAP_CONFIG,
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
                </Animated.View>

                <Animated.View
                    pointerEvents="none"
                    className="absolute inset-0 border-4 border-white dark:border-[#1A1D24]"
                    style={mapRingStyle}
                />

                <LocationPin />

                <Animated.View
                    className="absolute bottom-4 right-4 gap-2"
                    style={expandedControlsStyle}
                    pointerEvents={isMapExpanded ? "auto" : "none"}
                >
                    <MapZoomControls
                        onZoomIn={() =>
                            cameraRef.current?.zoomTo(
                                Math.min(20, zoomLevel + 1),
                                250,
                            )
                        }
                        onZoomOut={() =>
                            cameraRef.current?.zoomTo(
                                Math.max(3, zoomLevel - 1),
                                250,
                            )
                        }
                        onRecenter={handleResetLocation}
                    />
                </Animated.View>
            </Animated.View>

            <Animated.View
                className="absolute bottom-0 left-0 right-0 z-20 h-[40%] rounded-t-[32px] bg-white dark:bg-[#1A1D24] px-4 pt-6 shadow-lg"
                style={bottomSheetStyle}
                pointerEvents={isMapExpanded ? "none" : "auto"}
            >
                <LocationIntroSheet
                    bottomInset={insets.bottom}
                    onGotIt={handleExpandMap}
                />
            </Animated.View>

            <Animated.View
                className="absolute bottom-5 left-4 right-4 z-30 gap-3"
                style={[confirmationStyle, { paddingBottom: Math.max(insets.bottom, 4) }]}
                pointerEvents={isMapExpanded ? "auto" : "none"}
            >
                <LocationConfirmation
                    selectedLocation={selectedLocation}
                    isConfirmed={isConfirmed}
                    onConfirm={handleConfirmLocation}
                />
            </Animated.View>

        </View>
    );
}
