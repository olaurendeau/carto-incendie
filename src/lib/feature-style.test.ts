import { describe, expect, it } from "vitest";
import {
  getFeatureColor,
  getFeatureStyle,
  validateZoneFeatureData,
} from "@/lib/feature-style";
import { FEATURE_KIND_COLORS, type ZoneFeatureFormData } from "@/types/fire";

const ligne = (over: Partial<ZoneFeatureFormData> = {}): ZoneFeatureFormData => ({
  kind: "main_courante",
  geometryType: "ligne",
  coordinates: [
    { lat: 44.7, lng: 6.5 },
    { lat: 44.8, lng: 6.6 },
  ],
  label: "",
  note: "",
  color: null,
  ...over,
});

describe("getFeatureColor", () => {
  it("impose la couleur du type pour les types prédéfinis", () => {
    expect(getFeatureColor("main_courante", "#000000")).toBe(
      FEATURE_KIND_COLORS.main_courante
    );
    expect(getFeatureColor("zone_risque_pierres", null)).toBe(
      FEATURE_KIND_COLORS.zone_risque_pierres
    );
  });

  it("utilise la couleur personnalisée pour « autre », avec repli", () => {
    expect(getFeatureColor("autre", "#00ff00")).toBe("#00ff00");
    expect(getFeatureColor("autre", null)).toBe(FEATURE_KIND_COLORS.autre);
    expect(getFeatureColor("autre", "pas-une-couleur")).toBe(
      FEATURE_KIND_COLORS.autre
    );
  });
});

describe("getFeatureStyle", () => {
  it("style une ligne sans remplissage", () => {
    const style = getFeatureStyle({
      kind: "main_courante",
      geometryType: "ligne",
      color: null,
    });
    expect(style.color).toBe(FEATURE_KIND_COLORS.main_courante);
    expect(style.weight).toBe(4);
    expect(style.fillColor).toBeUndefined();
  });

  it("style un polygone avec remplissage semi-transparent", () => {
    const style = getFeatureStyle({
      kind: "zone_risque_pierres",
      geometryType: "polygone",
      color: null,
    });
    expect(style.fillColor).toBe(FEATURE_KIND_COLORS.zone_risque_pierres);
    expect(style.fillOpacity).toBe(0.25);
  });
});

describe("validateZoneFeatureData", () => {
  it("accepte une ligne valide", () => {
    expect(validateZoneFeatureData(ligne())).toBeNull();
  });

  it("exige au moins 2 points pour une ligne et 3 pour un polygone", () => {
    expect(
      validateZoneFeatureData(ligne({ coordinates: [{ lat: 1, lng: 2 }] }))
    ).toBe("Une ligne nécessite au moins 2 points");
    expect(
      validateZoneFeatureData(
        ligne({
          kind: "zone_risque_pierres",
          geometryType: "polygone",
          coordinates: [
            { lat: 1, lng: 2 },
            { lat: 3, lng: 4 },
          ],
        })
      )
    ).toBe("Un polygone nécessite au moins 3 points");
  });

  it("refuse une géométrie incompatible avec le type", () => {
    expect(
      validateZoneFeatureData(ligne({ kind: "zone_risque_pierres" }))
    ).toBe("Géométrie incompatible avec ce type d'annotation");
  });

  it("limite la note à 2000 caractères (après trim)", () => {
    expect(validateZoneFeatureData(ligne({ note: "a".repeat(2000) }))).toBeNull();
    expect(validateZoneFeatureData(ligne({ note: "a".repeat(2001) }))).toBe(
      "La note est limitée à 2000 caractères"
    );
    expect(
      validateZoneFeatureData(ligne({ note: "a".repeat(2000) + "   " }))
    ).toBeNull();
  });

  it("refuse une couleur invalide et des coordonnées non finies", () => {
    expect(validateZoneFeatureData(ligne({ color: "rouge" }))).toBe(
      "Couleur invalide"
    );
    expect(
      validateZoneFeatureData(
        ligne({ coordinates: [{ lat: NaN, lng: 2 }, { lat: 1, lng: 2 }] })
      )
    ).toBe("Coordonnées invalides");
  });
});
