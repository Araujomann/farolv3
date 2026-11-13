import type { Accident } from "@/src/features/map/types/accident.types";

/** Converte os acidentes em GeoJSON de pontos para o `ShapeSource`. */
export function toAccidentFeatureCollection(
    accidents: Accident[],
): GeoJSON.FeatureCollection<GeoJSON.Point> {
    return {
        type: "FeatureCollection",
        features: accidents.map((accident) => ({
            type: "Feature",
            id: accident.id,
            geometry: {
                type: "Point",
                coordinates: [accident.longitude, accident.latitude],
            },
            properties: {
                accidentId: accident.id,
                severity: accident.severity,
            },
        })),
    };
}
