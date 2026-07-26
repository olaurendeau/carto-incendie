/**
 * Configuration des fonds de carte.
 * Centralise les URLs et métadonnées pour faciliter l'ajout de nouveaux fonds.
 */

/** Identifiants des fonds de carte (base). */
export const MAP_BACKGROUND_IDS = ["topo", "satellite"] as const;
export type MapBackgroundId = (typeof MAP_BACKGROUND_IDS)[number];

export const MAP_BACKGROUNDS: Record<
  MapBackgroundId,
  { url: string; label: string }
> = {
  topo: {
    url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
    label: "Topo (OpenTopoMap)",
  },
  satellite: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    label: "Satellite (ESRI)",
  },
};

const TILE_LAYER_STORAGE_KEY = "carto-incendie-tile-layer";

export const getStoredTileLayer = (): MapBackgroundId => {
  if (typeof window === "undefined") return "topo";
  try {
    const stored = localStorage.getItem(TILE_LAYER_STORAGE_KEY);
    if (stored === "topo" || stored === "satellite") return stored;
    return "topo";
  } catch {
    return "topo";
  }
};

export const saveTileLayer = (id: MapBackgroundId): void => {
  try {
    localStorage.setItem(TILE_LAYER_STORAGE_KEY, id);
  } catch {
    // Ignore
  }
};
