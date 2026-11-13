import { SearchBar } from "@/components";
import { AccidentMarker, MapFilters, useAccidents } from "@/src/features/map";
import {
    MapEmptyOverlay,
    MapErrorOverlay,
    MapLoadingOverlay,
} from "@/src/features/map/components/MapStatusOverlays";
import {
    MapViewModeToggle,
    type MapViewMode,
} from "@/src/features/map/components/MapViewModeToggle";
import { SelectedAccidentCard } from "@/src/features/map/components/SelectedAccidentCard";
import { SeverityLegend } from "@/src/features/map/components/SeverityLegend";
import {
    BASEMAP_CONFIG,
    CAMERA_PADDING,
    CITY_OVERVIEW_ZOOM,
    createHeatmapStyle,
    DEFAULT_CENTER,
    MAP_STYLE_JSON,
    SEARCH_ZOOM_LEVELS,
} from "@/src/features/map/constants/mapConfig";
import type { MapPlaceSearchResult } from "@/src/features/map/services/placeSearch";
import { toAccidentFeatureCollection } from "@/src/features/map/utils/mapGeometry";
import Mapbox from "@rnmapbox/maps";
import { useFocusEffect, useRouter } from "expo-router";
import * as Notifications from "expo-notifications";
import { useCallback, useMemo, useRef, useState } from "react";
import { Keyboard, View } from "react-native";
import { isAccidentApprovedNotification } from "@/src/features/notifications/pushNotifications";

import { useAppTheme } from "@/src/theme/useAppTheme";

export default function MapScreen() {
    const { colors, isDark } = useAppTheme();
    const router = useRouter();
    const {
        accidents,
        error,
        isLoading,
        retry,
        refreshSilently,
        checkForUpdates,
        filters,
        applyFilters,
        clearFilters,
    } = useAccidents();
    const cameraRef = useRef<Mapbox.Camera>(null);
    const [selectedAccidentId, setSelectedAccidentId] = useState<string | null>(
        null,
    );
    const [searchedPlace, setSearchedPlace] =
        useState<MapPlaceSearchResult | null>(null);
    const searchedPlaceZoom = searchedPlace
        ? SEARCH_ZOOM_LEVELS[searchedPlace.category]
        : undefined;
    const [suggestionsHeight, setSuggestionsHeight] = useState(0);
    const [viewMode, setViewMode] = useState<MapViewMode>("markers");

    const handleSuggestionsHeightChange = useCallback((height: number) => {
        setSuggestionsHeight(height);
    }, []);

    const handleSelectPlace = useCallback((place: MapPlaceSearchResult) => {
        setSelectedAccidentId(null);
        setSearchedPlace(place);
        cameraRef.current?.setCamera({
            centerCoordinate: place.center,
            zoomLevel: SEARCH_ZOOM_LEVELS[place.category],
            animationMode: "flyTo",
            animationDuration: 1200,
        });
    }, []);

    // Keep the cached map and only download it again when the API reports
    // that the accidents changed since the last load.
    useFocusEffect(
        useCallback(() => {
            void checkForUpdates();
        }, [checkForUpdates]),
    );

    useFocusEffect(
        useCallback(() => {
            const subscription =
                Notifications.addNotificationReceivedListener(
                    (notification) => {
                        if (isAccidentApprovedNotification(notification)) {
                            refreshSilently();
                        }
                    },
                );

            return () => subscription.remove();
        }, [refreshSilently]),
    );

    const selectedAccident = useMemo(
        () => accidents.find((accident) => accident.id === selectedAccidentId),
        [accidents, selectedAccidentId],
    );
    // Memoizado: uma nova referência faz o ShapeSource reenviar e
    // reprocessar todo o GeoJSON no lado nativo.
    const accidentGeoJson = useMemo(
        () => toAccidentFeatureCollection(accidents),
        [accidents],
    );
    const basemapConfig = useMemo(
        () => ({
            ...BASEMAP_CONFIG,
            lightPreset: isDark ? ("night" as const) : ("day" as const),
        }),
        [isDark],
    );
    const heatmapStyle = useMemo(
        () => createHeatmapStyle(colors.error),
        [colors.error],
    );
    const handleSelectAccident = useCallback((accidentId: string) => {
        setSelectedAccidentId(accidentId);
    }, []);
    // Os marcadores só são recriados quando os dados ou a seleção mudam
    // (não a cada letra digitada na busca, por exemplo).
    const markers = useMemo(
        () =>
            accidents.map((accident) => (
                <AccidentMarker
                    key={accident.id}
                    accident={accident}
                    selected={selectedAccidentId === accident.id}
                    onSelect={handleSelectAccident}
                />
            )),
        [accidents, handleSelectAccident, selectedAccidentId],
    );

    return (
        <View className="flex-1">
            <SearchBar
                onSelectPlace={handleSelectPlace}
                onSuggestionsHeightChange={handleSuggestionsHeightChange}
            />
            {viewMode === "markers" && (
                <MapFilters
                    filters={filters}
                    onApply={applyFilters}
                    onClear={clearFilters}
                    onInteraction={Keyboard.dismiss}
                    topOffset={suggestionsHeight > 0 ? 92 + suggestionsHeight : 84}
                />
            )}

            <Mapbox.MapView
                style={{ flex: 1 }}
                styleJSON={MAP_STYLE_JSON}
                onTouchStart={Keyboard.dismiss}
            >
                <Mapbox.StyleImport
                    id="basemap"
                    existing
                    config={basemapConfig}
                />

                {/* Abre com Imperatriz inteira centralizada e não segue os
                    acidentes carregados ou filtrados: a câmera só se move
                    pela busca ou pelos gestos do usuário. */}
                <Mapbox.Camera
                    ref={cameraRef}
                    centerCoordinate={searchedPlace?.center ?? DEFAULT_CENTER}
                    zoomLevel={searchedPlaceZoom ?? CITY_OVERVIEW_ZOOM}
                    pitch={35}
                    animationMode="flyTo"
                    animationDuration={2000}
                    padding={CAMERA_PADDING}
                />

                <Mapbox.ShapeSource
                    id="accidents"
                    shape={accidentGeoJson}
                >
                    {viewMode === "heatmap" ? (
                        <Mapbox.HeatmapLayer
                            id="accident-heatmap"
                            style={heatmapStyle}
                        />
                    ) : undefined}
                </Mapbox.ShapeSource>

                {viewMode === "markers" && markers}
            </Mapbox.MapView>

            <View
                className="absolute bottom-7 left-4 items-start gap-2"
                onTouchStart={Keyboard.dismiss}
            >
                <MapViewModeToggle
                    viewMode={viewMode}
                    onShowMarkers={() => setViewMode("markers")}
                    onShowHeatmap={() => {
                        setViewMode("heatmap");
                        setSelectedAccidentId(null);
                    }}
                />

                {viewMode === "markers" &&
                    !isLoading &&
                    !error &&
                    accidents.length > 0 && <SeverityLegend />}
            </View>

            {selectedAccident && (
                <SelectedAccidentCard
                    accident={selectedAccident}
                    onClose={() => setSelectedAccidentId(null)}
                    onOpenDetails={() =>
                        router.push({
                            pathname: "/map/[accidentId]",
                            params: { accidentId: selectedAccident.id },
                        })
                    }
                />
            )}

            {isLoading && <MapLoadingOverlay />}

            {error && !isLoading && (
                <MapErrorOverlay message={error} onRetry={retry} />
            )}

            {!isLoading && !error && accidents.length === 0 && (
                <MapEmptyOverlay />
            )}
        </View>
    );
}
