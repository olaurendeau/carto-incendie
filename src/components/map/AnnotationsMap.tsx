"use client";

import "leaflet/dist/leaflet.css";
import "@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css";
// Expose window.L puis charge geoman (augmente L.Map avec `.pm`) —
// uniquement côté client (ssr:false).
import "@/components/map/geoman-setup";
import "@geoman-io/leaflet-geoman-free";
import { useState } from "react";
import { CircleMarker, MapContainer, TileLayer } from "react-leaflet";
import {
  GeomanController,
  type EditorMode,
} from "@/components/map/GeomanController";
import type { FeatureDraft } from "@/components/annotations/editor-types";
import {
  MAP_BACKGROUNDS,
  TILE_LAYER_REQUEST_OPTIONS,
  getStoredTileLayer,
} from "@/lib/map-layers";
import type { FirePoint, PublicZone, ZoneFeature } from "@/lib/db/schema";
import { CRITICITE_COLORS, type LatLngPoint } from "@/types/fire";

type AnnotationsMapProps = {
  zone: PublicZone;
  firePoints: FirePoint[];
  features: ZoneFeature[];
  mode: EditorMode;
  draft: FeatureDraft | null;
  rebuildToken: number;
  onCreate: (coordinates: LatLngPoint[]) => void;
  onUpdate: (featureId: string, coordinates: LatLngPoint[]) => void;
  onRemoveRequest: (featureId: string) => void;
  onSelect: (featureId: string) => void;
};

export const AnnotationsMap = ({
  zone,
  firePoints,
  features,
  mode,
  draft,
  rebuildToken,
  onCreate,
  onUpdate,
  onRemoveRequest,
  onSelect,
}: AnnotationsMapProps) => {
  const [tileLayer] = useState(() => getStoredTileLayer());

  return (
    <MapContainer
      center={[zone.centerLat, zone.centerLng]}
      zoom={zone.zoom}
      className="h-full w-full"
      scrollWheelZoom
      attributionControl={false}
    >
      <TileLayer
        key={tileLayer}
        url={MAP_BACKGROUNDS[tileLayer].url}
        maxNativeZoom={MAP_BACKGROUNDS[tileLayer].maxNativeZoom}
        {...TILE_LAYER_REQUEST_OPTIONS}
      />
      {/* Points d'incendie en contexte, non interactifs. */}
      {firePoints.map((point) => (
        <CircleMarker
          key={point.id}
          center={[point.latitude, point.longitude]}
          radius={7}
          interactive={false}
          pathOptions={{
            color: "#ffffff",
            weight: 2,
            fillColor: CRITICITE_COLORS[point.criticite],
            fillOpacity: 0.8,
          }}
        />
      ))}
      <GeomanController
        features={features}
        mode={mode}
        draft={draft}
        rebuildToken={rebuildToken}
        onCreate={onCreate}
        onUpdate={onUpdate}
        onRemoveRequest={onRemoveRequest}
        onSelect={onSelect}
      />
    </MapContainer>
  );
};
