import { toAccidentFeatureCollection } from "@/src/features/map/utils/mapGeometry";
import { makeAccident } from "@/test/fixtures";

describe("toAccidentFeatureCollection", () => {
    it("converte acidentes em pontos GeoJSON na ordem [longitude, latitude]", () => {
        const accident = makeAccident({
            id: "a-1",
            latitude: -5.5,
            longitude: -47.4,
            severity: "critical",
        });

        expect(toAccidentFeatureCollection([accident])).toEqual({
            type: "FeatureCollection",
            features: [
                {
                    type: "Feature",
                    id: "a-1",
                    geometry: { type: "Point", coordinates: [-47.4, -5.5] },
                    properties: { accidentId: "a-1", severity: "critical" },
                },
            ],
        });
    });

    it("gera uma coleção vazia quando não há acidentes", () => {
        expect(toAccidentFeatureCollection([]).features).toEqual([]);
    });
});
