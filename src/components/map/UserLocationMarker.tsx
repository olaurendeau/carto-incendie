"use client";

import { Circle, CircleMarker } from "react-leaflet";
import type { GeoPositionWithAccuracy } from "@/lib/geo";

const LOCATION_COLOR = "#3b82f6";

type UserLocationMarkerProps = {
  position: GeoPositionWithAccuracy;
};

/** Position de l'utilisateur : point bleu + halo de précision, non interactifs. */
export const UserLocationMarker = ({ position }: UserLocationMarkerProps) => {
  const center: [number, number] = [position.latitude, position.longitude];
  return (
    <>
      <Circle
        center={center}
        radius={position.accuracy}
        interactive={false}
        pathOptions={{
          color: LOCATION_COLOR,
          weight: 1,
          fillColor: LOCATION_COLOR,
          fillOpacity: 0.12,
        }}
      />
      <CircleMarker
        center={center}
        radius={7}
        interactive={false}
        pathOptions={{
          color: "#ffffff",
          weight: 3,
          fillColor: LOCATION_COLOR,
          fillOpacity: 1,
        }}
      />
    </>
  );
};
