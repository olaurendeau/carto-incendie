/**
 * Configuration des fonds de carte.
 * Centralise les URLs et métadonnées pour faciliter l'ajout de nouveaux fonds.
 */

/** Identifiants des fonds de carte (base). */
export const MAP_BACKGROUND_IDS = ["topo", "scan25", "satellite"] as const;
export type MapBackgroundId = (typeof MAP_BACKGROUND_IDS)[number];

// Clé d'accès aux couches IGN non ouvertes (SCAN 25). Préfixe NEXT_PUBLIC_
// car l'URL des tuiles est construite côté client.
const IGN_KEY = process.env.NEXT_PUBLIC_IGN_KEY;

export const MAP_BACKGROUNDS: Record<
  MapBackgroundId,
  { url: string; label: string; maxNativeZoom?: number }
> = {
  topo: {
    url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
    label: "Topo (OpenTopoMap)",
  },
  scan25: {
    url: `https://data.geopf.fr/private/wmts?SERVICE=WMTS&VERSION=1.0.0&REQUEST=GetTile&LAYER=GEOGRAPHICALGRIDSYSTEMS.MAPS.SCAN25TOUR&STYLE=normal&FORMAT=image/jpeg&TILEMATRIXSET=PM&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&apikey=${IGN_KEY ?? ""}`,
    label: "IGN SCAN 25",
    // La couche s'arrête au zoom 16 : au-delà, Leaflet agrandit les tuiles.
    maxNativeZoom: 16,
  },
  satellite: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    label: "Satellite (ESRI)",
  },
};

/** Le SCAN 25 n'est proposé que si une clé IGN est configurée. */
export const isScan25Available = (): boolean => !!IGN_KEY;

/** Fonds proposables à l'utilisateur. */
export const getAvailableBackgroundIds = (): MapBackgroundId[] =>
  MAP_BACKGROUND_IDS.filter((id) => id !== "scan25" || isScan25Available());

/** Fond par défaut : le SCAN 25 quand la clé IGN est là, sinon OpenTopoMap. */
export const getDefaultBackgroundId = (): MapBackgroundId =>
  isScan25Available() ? "scan25" : "topo";

/**
 * Options économes en requêtes tuiles (quota IGN) :
 * - updateWhenIdle : attendre la fin du déplacement plutôt que charger en continu ;
 * - updateWhenZooming false : pas de chargement aux paliers intermédiaires d'un zoom animé ;
 * - keepBuffer : garder plus de tuiles autour de l'écran (retours en arrière sans requête).
 */
export const TILE_LAYER_REQUEST_OPTIONS = {
  updateWhenIdle: true,
  updateWhenZooming: false,
  keepBuffer: 4,
} as const;

const TILE_LAYER_STORAGE_KEY = "carto-incendie-tile-layer";

const isBackgroundId = (value: string): value is MapBackgroundId =>
  (MAP_BACKGROUND_IDS as readonly string[]).includes(value);

export const getStoredTileLayer = (): MapBackgroundId => {
  if (typeof window === "undefined") return getDefaultBackgroundId();
  try {
    const stored = localStorage.getItem(TILE_LAYER_STORAGE_KEY);
    if (
      stored != null &&
      isBackgroundId(stored) &&
      getAvailableBackgroundIds().includes(stored)
    ) {
      return stored;
    }
    return getDefaultBackgroundId();
  } catch {
    return getDefaultBackgroundId();
  }
};

export const saveTileLayer = (id: MapBackgroundId): void => {
  try {
    localStorage.setItem(TILE_LAYER_STORAGE_KEY, id);
  } catch {
    // Ignore
  }
};
