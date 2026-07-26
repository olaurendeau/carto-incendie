"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useCallback, useEffect, useState } from "react";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import {
  MAP_BACKGROUNDS,
  getStoredTileLayer,
  type MapBackgroundId,
} from "@/lib/map-layers";

const markerIcon = L.icon({
  iconUrl: "/marker-icon.png",
  iconRetinaUrl: "/marker-icon-2x.png",
  shadowUrl: "/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Centre de la France métropolitaine : point de départ neutre avant sélection.
const DEFAULT_CENTER: [number, number] = [46.6, 2.4];
const DEFAULT_ZOOM = 5;

type MapEventsProps = {
  onSelect: (lat: number, lng: number) => void;
  onZoomChange?: (zoom: number) => void;
};

const MapEvents = ({ onSelect, onZoomChange }: MapEventsProps) => {
  const map = useMapEvents({
    click: (e) => {
      onSelect(e.latlng.lat, e.latlng.lng);
    },
    zoomend: () => {
      // getZoom() peut être fractionnaire pendant une animation flyTo : on arrondit.
      onZoomChange?.(Math.round(map.getZoom()));
    },
  });
  return null;
};

type MapCenterToPositionProps = {
  position: [number, number] | null;
};

/** Zoom minimum après sélection : évite de rester sur la vue France entière. */
const MIN_ZOOM_ON_SELECT = 12;

const MapCenterToPosition = ({ position }: MapCenterToPositionProps) => {
  const map = useMap();
  useEffect(() => {
    if (!position) return;
    // Recentrer en zoomant au moins à un niveau utile (déclenche zoomend → sync du zoom de zone).
    map.flyTo(position, Math.max(map.getZoom(), MIN_ZOOM_ON_SELECT), {
      duration: 0.3,
    });
  }, [map, position]);
  return null;
};

type MapPickerProps = {
  position: { latitude: number; longitude: number } | null;
  initialZoom?: number;
  onSelect: (latitude: number, longitude: number) => void;
  /** Si fourni, le zoom de la mini-carte est remonté (utilisé pour le zoom de la zone). */
  onZoomChange?: (zoom: number) => void;
  height?: number;
};

export const MapPicker = ({
  position,
  initialZoom,
  onSelect,
  onZoomChange,
  height = 300,
}: MapPickerProps) => {
  // Composant chargé en ssr:false uniquement : lecture localStorage sûre à l'init.
  const [tileLayer] = useState<MapBackgroundId>(() => getStoredTileLayer());

  const center: [number, number] = position
    ? [position.latitude, position.longitude]
    : DEFAULT_CENTER;

  const handleDragEnd = useCallback(
    (e: L.LeafletEvent) => {
      const marker = e.target as L.Marker;
      const latlng = marker.getLatLng();
      onSelect(latlng.lat, latlng.lng);
    },
    [onSelect]
  );

  return (
    <div
      className="relative overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100"
      style={{ height }}
    >
      <MapContainer
        center={center}
        zoom={position ? initialZoom ?? 13 : DEFAULT_ZOOM}
        className="h-full w-full"
        scrollWheelZoom
        attributionControl={false}
      >
        <TileLayer url={MAP_BACKGROUNDS[tileLayer].url} />
        <MapEvents onSelect={onSelect} onZoomChange={onZoomChange} />
        <MapCenterToPosition
          position={position ? [position.latitude, position.longitude] : null}
        />
        {position ? (
          <Marker
            position={[position.latitude, position.longitude]}
            icon={markerIcon}
            draggable
            eventHandlers={{ dragend: handleDragEnd }}
          />
        ) : null}
      </MapContainer>
    </div>
  );
};
