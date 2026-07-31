import type { PathOptions } from "leaflet";
import {
  FEATURE_KIND_COLORS,
  FEATURE_KIND_GEOMETRY,
  FEATURE_GEOMETRY_KEYS,
  FEATURE_KIND_KEYS,
  type FeatureGeometry,
  type FeatureKind,
  type LatLngPoint,
  type ZoneFeatureFormData,
} from "@/types/fire";

const COLOR_RE = /^#[0-9a-f]{6}$/i;

/** Couleur effective d'une annotation : fixe pour les types prédéfinis,
 *  personnalisable pour « autre ». */
export const getFeatureColor = (
  kind: FeatureKind,
  color: string | null
): string => {
  if (kind === "autre" && color && COLOR_RE.test(color)) return color;
  return FEATURE_KIND_COLORS[kind];
};

/** Style Leaflet d'une annotation (utilisé par l'éditeur et le rendu public). */
export const getFeatureStyle = (feature: {
  kind: FeatureKind;
  geometryType: FeatureGeometry;
  color: string | null;
}): PathOptions => {
  const color = getFeatureColor(feature.kind, feature.color);
  if (feature.geometryType === "ligne") {
    return { color, weight: 4 };
  }
  return { color, weight: 2, fillColor: color, fillOpacity: 0.25 };
};

const MIN_POINTS: Record<FeatureGeometry, number> = {
  ligne: 2,
  polygone: 3,
};

const isValidPoint = (p: unknown): p is LatLngPoint =>
  typeof p === "object" &&
  p != null &&
  Number.isFinite((p as LatLngPoint).lat) &&
  Number.isFinite((p as LatLngPoint).lng);

/** Valide les données d'une annotation ; retourne un message d'erreur ou null. */
export const validateZoneFeatureData = (
  data: ZoneFeatureFormData
): string | null => {
  if (!FEATURE_KIND_KEYS.includes(data.kind)) {
    return "Type d'annotation invalide";
  }
  if (!FEATURE_GEOMETRY_KEYS.includes(data.geometryType)) {
    return "Géométrie invalide";
  }
  const imposed = FEATURE_KIND_GEOMETRY[data.kind];
  if (imposed != null && data.geometryType !== imposed) {
    return "Géométrie incompatible avec ce type d'annotation";
  }
  if (
    !Array.isArray(data.coordinates) ||
    !data.coordinates.every(isValidPoint)
  ) {
    return "Coordonnées invalides";
  }
  if (data.coordinates.length < MIN_POINTS[data.geometryType]) {
    return data.geometryType === "ligne"
      ? "Une ligne nécessite au moins 2 points"
      : "Un polygone nécessite au moins 3 points";
  }
  if (data.label.trim().length > 120) {
    return "Le libellé est limité à 120 caractères";
  }
  if (data.note.trim().length > 2000) {
    return "La note est limitée à 2000 caractères";
  }
  if (data.color != null && !COLOR_RE.test(data.color)) {
    return "Couleur invalide";
  }
  return null;
};
