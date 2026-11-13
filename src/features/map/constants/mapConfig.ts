import type { HeatmapLayerStyle } from "@rnmapbox/maps";

import { SEVERITY_COLORS } from "@/src/theme/colors";

/** Centro padrão dos mapas (Imperatriz, MA), em [longitude, latitude]. */
export const DEFAULT_CENTER: [number, number] = [-47.47812, -5.52693];

/**
 * Zoom da visão geral da cidade no mapa principal: Imperatriz inteira
 * visível e centralizada, sem focar em nenhum acidente. Valores menores
 * afastam a câmera; maiores aproximam.
 */
export const CITY_OVERVIEW_ZOOM = 12.5;

/** Estilo base: importa o Mapbox Standard com o id "basemap". */
export const MAP_STYLE = {
    version: 8,
    imports: [
        {
            id: "basemap",
            url: "mapbox://styles/mapbox/standard",
        },
    ],
} as const;

// Serializado uma vez só: o MapView recebe sempre a mesma string.
export const MAP_STYLE_JSON = JSON.stringify(MAP_STYLE);

/** Configuração do import "basemap" (sem o `lightPreset`, que segue o tema). */
export const BASEMAP_CONFIG = {
    theme: "default",
    font: "DIN Pro",
    showTransitLabels: true,
    show3dObjects: true,
    show3dBuildings: true,
    show3dTrees: true,
    show3dFacades: true,
    show3dLandmarks: true,
} as const;

/** Zoom aplicado ao selecionar um resultado da busca, por categoria. */
export const SEARCH_ZOOM_LEVELS = {
    Estabelecimento: 18,
    Rua: 17,
} as const;

export const CAMERA_PADDING = {
    paddingTop: 140,
    paddingRight: 48,
    paddingBottom: 120,
    paddingLeft: 48,
};

/** Cores dos marcadores por severidade (desconhecida usa a cor de "baixa"). */
export const MARKER_COLORS = {
    ...SEVERITY_COLORS,
    unknown: SEVERITY_COLORS.low,
} as const;

/** Estilo da camada de mapa de calor; a cor mais intensa segue o tema. */
export function createHeatmapStyle(errorColor: string): HeatmapLayerStyle {
    return {
        heatmapWeight: 1,
        heatmapIntensity: [
            "interpolate",
            ["linear"],
            ["zoom"],
            0,
            0.8,
            14,
            1.4,
        ],
        heatmapRadius: [
            "interpolate",
            ["linear"],
            ["zoom"],
            0,
            12,
            14,
            32,
        ],
        heatmapColor: [
            "interpolate",
            ["linear"],
            ["heatmap-density"],
            0,
            "rgba(33, 102, 172, 0)",
            0.2,
            "#65B7FF",
            0.4,
            "#FFD166",
            0.7,
            "#FF8A80",
            1,
            errorColor,
        ],
        heatmapOpacity: 0.88,
    };
}
