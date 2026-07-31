"use client";

import { Polygon, Polyline, Popup } from "react-leaflet";
import { getFeatureStyle } from "@/lib/feature-style";
import type { ZoneFeature } from "@/lib/db/schema";
import { FEATURE_KIND_LABELS, QUALITE_LABELS } from "@/types/fire";

type ZoneFeaturesLayerProps = {
  features: ZoneFeature[];
};

const FeaturePopup = ({ feature }: { feature: ZoneFeature }) => (
  <Popup>
    <div className="max-h-[45vh] min-w-[160px] max-w-[240px] space-y-1 overflow-y-auto">
      <p className="font-semibold text-zinc-900">
        {feature.label || FEATURE_KIND_LABELS[feature.kind]}
      </p>
      {feature.label ? (
        <p className="text-xs text-zinc-500">
          {FEATURE_KIND_LABELS[feature.kind]}
        </p>
      ) : null}
      {feature.note ? (
        <p className="whitespace-pre-line text-sm text-zinc-700">
          {feature.note}
        </p>
      ) : null}
      {feature.creatorName || feature.creatorQualite ? (
        <p className="text-xs text-zinc-500">
          Ajoutée par {feature.creatorName || "anonyme"}
          {feature.creatorQualite
            ? ` · ${QUALITE_LABELS[feature.creatorQualite]}`
            : ""}
        </p>
      ) : null}
    </div>
  </Popup>
);

/** Rendu public (lecture seule) des annotations dessinées par l'admin. */
export const ZoneFeaturesLayer = ({ features }: ZoneFeaturesLayerProps) => (
  <>
    {features.map((feature) => {
      const positions = feature.coordinates.map(
        (c) => [c.lat, c.lng] as [number, number]
      );
      const style = getFeatureStyle(feature);
      return feature.geometryType === "ligne" ? (
        <Polyline key={feature.id} positions={positions} pathOptions={style}>
          <FeaturePopup feature={feature} />
        </Polyline>
      ) : (
        <Polygon key={feature.id} positions={positions} pathOptions={style}>
          <FeaturePopup feature={feature} />
        </Polygon>
      );
    })}
  </>
);
