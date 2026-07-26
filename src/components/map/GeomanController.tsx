"use client";

import L from "leaflet";
import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import { getFeatureStyle } from "@/lib/feature-style";
import type { ZoneFeature } from "@/lib/db/schema";
import { FEATURE_KIND_LABELS, type LatLngPoint } from "@/types/fire";
import type { FeatureDraft } from "@/components/annotations/editor-types";

export type EditorMode = "idle" | "draw" | "edit" | "remove";

type GeomanControllerProps = {
  features: ZoneFeature[];
  mode: EditorMode;
  draft: FeatureDraft | null;
  /** Force la reconstruction des couches (rollback visuel) sans changer `features`. */
  rebuildToken: number;
  onCreate: (coordinates: LatLngPoint[]) => void;
  onUpdate: (featureId: string, coordinates: LatLngPoint[]) => void;
  onRemoveRequest: (featureId: string) => void;
};

/** Geoman n'augmente pas le type de base L.Layer avec `pm`. */
type PMLayer = L.Layer & {
  pm?: {
    enable: (options?: {
      allowSelfIntersection?: boolean;
      draggable?: boolean;
    }) => void;
    disable: () => void;
  };
};

/** Aplatit les latlngs d'une couche (L.Polygon renvoie l'anneau extérieur en [0]). */
const toPoints = (layer: L.Layer): LatLngPoint[] => {
  const raw = (layer as L.Polyline).getLatLngs();
  const flat = Array.isArray(raw[0])
    ? (raw[0] as L.LatLng[])
    : (raw as L.LatLng[]);
  return flat.map((ll) => ({ lat: ll.lat, lng: ll.lng }));
};

const enableLayerEdit = (layer: L.Layer) => {
  (layer as PMLayer).pm?.enable({
    allowSelfIntersection: true,
    draggable: true,
  });
};

/**
 * Pilote leaflet-geoman de manière impérative : les annotations persistées
 * sont des couches Leaflet brutes reconstruites depuis l'état React (source
 * de vérité), ce qui sert aussi de rollback visuel en cas d'échec d'action.
 * La toolbar geoman n'est jamais affichée (toolbar française custom).
 */
export const GeomanController = ({
  features,
  mode,
  draft,
  rebuildToken,
  onCreate,
  onUpdate,
  onRemoveRequest,
}: GeomanControllerProps) => {
  const map = useMap();
  const layerGroupRef = useRef<L.LayerGroup | null>(null);
  const layerToFeatureIdRef = useRef(new Map<L.Layer, string>());
  const modeRef = useRef(mode);
  const onCreateRef = useRef(onCreate);
  const onUpdateRef = useRef(onUpdate);
  const onRemoveRequestRef = useRef(onRemoveRequest);

  useEffect(() => {
    modeRef.current = mode;
    onCreateRef.current = onCreate;
    onUpdateRef.current = onUpdate;
    onRemoveRequestRef.current = onRemoveRequest;
  });

  // Initialisation geoman + groupe de couches.
  useEffect(() => {
    map.pm.setLang("fr");
    map.pm.setGlobalOptions({ snappable: true, snapDistance: 20 });
    const group = L.layerGroup().addTo(map);
    layerGroupRef.current = group;
    return () => {
      map.pm.disableDraw();
      group.remove();
      layerGroupRef.current = null;
    };
  }, [map]);

  // Listeners globaux création / suppression.
  useEffect(() => {
    const handleCreate = (e: { layer: L.Layer }) => {
      const coordinates = toPoints(e.layer);
      // Couche temporaire : la version persistée sera reconstruite depuis l'état.
      e.layer.remove();
      onCreateRef.current(coordinates);
    };
    const handleRemove = (e: { layer: L.Layer }) => {
      const featureId = layerToFeatureIdRef.current.get(e.layer);
      if (featureId) onRemoveRequestRef.current(featureId);
    };
    map.on("pm:create", handleCreate);
    map.on("pm:remove", handleRemove);
    return () => {
      map.off("pm:create", handleCreate);
      map.off("pm:remove", handleRemove);
    };
  }, [map]);

  // Reconstruction des couches depuis l'état.
  // Ne s'exécute jamais pendant le mode edit (features n'y change pas),
  // ce qui préserverait sinon les poignées de sommets.
  useEffect(() => {
    const group = layerGroupRef.current;
    if (!group) return;
    group.clearLayers();
    layerToFeatureIdRef.current.clear();

    features.forEach((feature) => {
      const latlngs = feature.coordinates.map(
        (c) => [c.lat, c.lng] as [number, number]
      );
      const style = getFeatureStyle(feature);
      const layer =
        feature.geometryType === "ligne"
          ? L.polyline(latlngs, style)
          : L.polygon(latlngs, style);
      layer.bindTooltip(feature.label || FEATURE_KIND_LABELS[feature.kind], {
        sticky: true,
      });
      // pm:update est émis par geoman à la désactivation du mode édition,
      // pour chaque couche modifiée (sauvegarde batch à la sortie du mode).
      layer.on("pm:update", (e) => {
        onUpdateRef.current(feature.id, toPoints(e.layer as L.Layer));
      });
      layerToFeatureIdRef.current.set(layer, feature.id);
      group.addLayer(layer);
    });

    // Ré-appliquer le mode courant aux couches reconstruites.
    if (modeRef.current === "edit") {
      group.eachLayer(enableLayerEdit);
    } else if (modeRef.current === "remove") {
      map.pm.disableGlobalRemovalMode();
      map.pm.enableGlobalRemovalMode();
    }
  }, [features, rebuildToken, map]);

  // Transitions de mode.
  useEffect(() => {
    const group = layerGroupRef.current;
    if (mode === "draw" && draft) {
      map.pm.enableDraw(draft.geometryType === "ligne" ? "Line" : "Polygon", {
        continueDrawing: false,
        pathOptions: getFeatureStyle(draft),
        templineStyle: { color: getFeatureStyle(draft).color },
        hintlineStyle: { color: getFeatureStyle(draft).color, dashArray: "5,5" },
      });
      return () => {
        map.pm.disableDraw();
      };
    }
    if (mode === "edit") {
      group?.eachLayer(enableLayerEdit);
      return () => {
        // pm.disable() déclenche pm:update sur chaque couche modifiée.
        group?.eachLayer((layer) => (layer as PMLayer).pm?.disable());
      };
    }
    if (mode === "remove") {
      map.pm.enableGlobalRemovalMode();
      return () => {
        map.pm.disableGlobalRemovalMode();
      };
    }
  }, [mode, draft, map]);

  return null;
};
