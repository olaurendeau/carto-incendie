"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import Link from "next/link";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import { MapLongPressHandler } from "@/components/map/MapLongPressHandler";
import { ConfirmButton } from "@/components/fire/ConfirmButton";
import { SharePointButton } from "@/components/fire/SharePointButton";
import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import { UserLocationMarker } from "@/components/map/UserLocationMarker";
import { ZoneFeaturesLayer } from "@/components/map/ZoneFeaturesLayer";
import { getMarkerAppearance } from "@/lib/fire-marker";
import {
  MAP_BACKGROUNDS,
  getDefaultBackgroundId,
  type MapBackgroundId,
} from "@/lib/map-layers";
import type { GeoPositionWithAccuracy } from "@/lib/geo";
import type { FirePoint, ZoneFeature } from "@/lib/db/schema";
import {
  CRITICITE_LABELS,
  QUALITE_LABELS,
  STATUT_LABELS,
} from "@/types/fire";

const MARKER_SIZE = 36;
const TIP_HEIGHT = 12;
const MARKER_HEIGHT = MARKER_SIZE + TIP_HEIGHT;

/** Épingle : cercle coloré + pointe triangulaire ancrée sur l'emplacement exact. */
const createFireMarkerIcon = (
  color: string,
  borderColor: string,
  symbol: string
): L.DivIcon => {
  const half = MARKER_SIZE / 2;
  return L.divIcon({
    className: "fire-marker",
    html: `
      <div style="
        display: flex;
        flex-direction: column;
        align-items: center;
        width: ${MARKER_SIZE}px;
        height: ${MARKER_HEIGHT}px;
        filter: drop-shadow(0 2px 4px rgba(0,0,0,0.35));
      ">
        <div style="
          width: ${MARKER_SIZE}px;
          height: ${MARKER_SIZE}px;
          border-radius: 50%;
          background: ${color};
          border: 3px solid ${borderColor};
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          font-weight: 700;
          color: white;
          text-shadow: 0 1px 2px rgba(0,0,0,0.5);
          font-family: system-ui, sans-serif;
        ">${symbol}</div>
        <div style="
          width: 0;
          height: 0;
          margin-top: -3px;
          border-left: 8px solid transparent;
          border-right: 8px solid transparent;
          border-top: ${TIP_HEIGHT + 3}px solid ${color};
        "></div>
      </div>
    `,
    iconSize: [MARKER_SIZE, MARKER_HEIGHT],
    iconAnchor: [half, MARKER_HEIGHT],
    popupAnchor: [0, -MARKER_HEIGHT],
  });
};

type FlyToUserProps = {
  position: GeoPositionWithAccuracy | null;
  token: number;
};

/** Recentre la carte sur la position quand le compteur est incrémenté. */
const FlyToUser = ({ position, token }: FlyToUserProps) => {
  const map = useMap();
  const positionRef = useRef(position);
  useEffect(() => {
    positionRef.current = position;
  }, [position]);

  useEffect(() => {
    if (token === 0 || positionRef.current == null) return;
    map.flyTo(
      [positionRef.current.latitude, positionRef.current.longitude],
      Math.max(map.getZoom(), 15),
      { duration: 0.5 }
    );
  }, [token, map]);

  return null;
};

const formatCreatedAt = (value: Date | string): string =>
  new Date(value).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

type FireMapProps = {
  zoneId: string;
  points: FirePoint[];
  features?: ZoneFeature[];
  center: [number, number];
  zoom: number;
  tileLayer?: MapBackgroundId;
  onLongPress?: (lat: number, lng: number) => void;
  userLocation?: GeoPositionWithAccuracy | null;
  flyToUserToken?: number;
};

export const FireMap = ({
  zoneId,
  points,
  features = [],
  center,
  zoom,
  tileLayer = getDefaultBackgroundId(),
  onLongPress,
  userLocation = null,
  flyToUserToken = 0,
}: FireMapProps) => {
  return (
    <MapContainer
      center={center}
      zoom={zoom}
      className="h-full w-full"
      scrollWheelZoom
      attributionControl={false}
    >
      <TileLayer
        key={tileLayer}
        url={MAP_BACKGROUNDS[tileLayer].url}
        maxNativeZoom={MAP_BACKGROUNDS[tileLayer].maxNativeZoom}
      />
      <ZoneFeaturesLayer features={features} />
      {userLocation != null ? (
        <UserLocationMarker position={userLocation} />
      ) : null}
      <FlyToUser position={userLocation} token={flyToUserToken} />
      {onLongPress != null ? (
        <MapLongPressHandler onLongPress={onLongPress} />
      ) : null}
      {points.map((point) => {
        const appearance = getMarkerAppearance(
          point.criticite,
          point.statut,
          point.confirmations
        );
        const icon = createFireMarkerIcon(
          appearance.color,
          appearance.borderColor,
          appearance.symbol
        );
        const creatorSummary = [
          point.creatorName?.trim() || null,
          point.creatorQualite ? QUALITE_LABELS[point.creatorQualite] : null,
        ]
          .filter((part): part is string => !!part)
          .join(" · ");
        const statutBySummary = [
          point.statutByName?.trim() || null,
          point.statutByQualite ? QUALITE_LABELS[point.statutByQualite] : null,
        ]
          .filter((part): part is string => !!part)
          .join(" · ");
        return (
          <Marker
            key={point.id}
            position={[point.latitude, point.longitude]}
            icon={icon}
          >
            <Popup>
              <div className="min-w-[220px] space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-zinc-900">
                    {CRITICITE_LABELS[point.criticite]}
                  </p>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      point.statut === "traite"
                        ? "bg-emerald-100 text-emerald-700"
                        : point.statut === "disparu"
                          ? "bg-zinc-200 text-zinc-600"
                          : "bg-red-100 text-red-700"
                    }`}
                  >
                    {STATUT_LABELS[point.statut]}
                  </span>
                </div>
                <dl className="space-y-1 text-sm text-zinc-600">
                  {creatorSummary ? (
                    <div className="flex gap-2">
                      <dt className="shrink-0 font-medium text-zinc-500">Par</dt>
                      <dd>{creatorSummary}</dd>
                    </div>
                  ) : null}
                  <div className="flex gap-2">
                    <dt className="shrink-0 font-medium text-zinc-500">Le</dt>
                    <dd>{formatCreatedAt(point.createdAt)}</dd>
                  </div>
                  {point.statut !== "en_cours" && statutBySummary ? (
                    <div className="flex gap-2">
                      <dt className="shrink-0 font-medium text-zinc-500">
                        {STATUT_LABELS[point.statut]} par
                      </dt>
                      <dd>{statutBySummary}</dd>
                    </div>
                  ) : null}
                  {point.note ? (
                    <div className="flex gap-2">
                      <dt className="shrink-0 font-medium text-zinc-500">
                        Note
                      </dt>
                      <dd className="line-clamp-3">{point.note}</dd>
                    </div>
                  ) : null}
                </dl>
                {point.photos.length > 0 ? (
                  <div className="flex gap-1.5 overflow-x-auto">
                    {point.photos.map((photo) => (
                      <a
                        key={photo.publicId}
                        href={photo.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Voir la photo en grand"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={photo.url}
                          alt="Photo du point d'incendie"
                          className="h-14 w-14 shrink-0 rounded-lg border border-zinc-200 object-cover"
                        />
                      </a>
                    ))}
                  </div>
                ) : null}
                <div className="mt-2 flex items-center justify-between gap-2">
                  <ConfirmButton
                    pointId={point.id}
                    confirmations={point.confirmations}
                  />
                  <Link
                    href={`/zone/${zoneId}/point/${point.id}/edit`}
                    className="inline-flex min-h-[32px] items-center justify-center rounded-lg border border-zinc-300 bg-white px-3 text-xs font-medium text-zinc-700 hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2"
                    tabIndex={0}
                    aria-label="Modifier ce point d'incendie"
                  >
                    Modifier
                  </Link>
                </div>
                <SharePointButton
                  latitude={point.latitude}
                  longitude={point.longitude}
                  compact
                />
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
};
