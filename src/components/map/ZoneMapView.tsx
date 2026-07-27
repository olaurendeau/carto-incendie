"use client";

import { Filter, Layers, LocateFixed } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  MAP_BACKGROUNDS,
  MAP_BACKGROUND_IDS,
  getStoredTileLayer,
  saveTileLayer,
  type MapBackgroundId,
} from "@/lib/map-layers";
import type { FirePoint, PublicZone, ZoneFeature } from "@/lib/db/schema";
import {
  watchCurrentPosition,
  type GeoPositionWithAccuracy,
} from "@/lib/geo";
import { STATUT_KEYS, STATUT_LABELS, type Statut } from "@/types/fire";

/** Par défaut, seuls les points en cours sont visibles sur la carte. */
const DEFAULT_VISIBLE_STATUTS: Statut[] = ["en_cours"];

const DynamicFireMap = dynamic(
  () => import("@/components/map/FireMap").then((m) => ({ default: m.FireMap })),
  {
    ssr: false,
    loading: () => (
      <div
        className="flex h-full w-full items-center justify-center bg-zinc-100 text-zinc-500"
        aria-label="Chargement de la carte"
      >
        <span className="text-lg">Chargement de la carte…</span>
      </div>
    ),
  }
);

const RefreshIcon = ({ spinning = false }: { spinning?: boolean }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
    className={spinning ? "animate-spin" : undefined}
  >
    <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 0 0 4.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 0 1-15.357-2m15.357 2H15" />
  </svg>
);

type ZoneMapViewProps = {
  zone: PublicZone;
  points: FirePoint[];
  features?: ZoneFeature[];
};

export const ZoneMapView = ({
  zone,
  points: initialPoints,
  features = [],
}: ZoneMapViewProps) => {
  const router = useRouter();
  const [points, setPoints] = useState<FirePoint[]>(initialPoints);
  // Le fond choisi n'affecte pas le HTML initial (carte en ssr:false, menu fermé) :
  // la lecture localStorage à l'init ne crée pas de mismatch d'hydratation.
  const [tileLayer, setTileLayer] = useState<MapBackgroundId>(() =>
    getStoredTileLayer()
  );
  const [isLayersOpen, setIsLayersOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [visibleStatuts, setVisibleStatuts] = useState<Statut[]>(
    DEFAULT_VISIBLE_STATUTS
  );
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [userLocation, setUserLocation] =
    useState<GeoPositionWithAccuracy | null>(null);
  const [flyToUserToken, setFlyToUserToken] = useState(0);
  const [longPressLocation, setLongPressLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const controlsRef = useRef<HTMLDivElement>(null);

  // Suivi de la position dès l'ouverture ; silencieux si refusée/indisponible.
  useEffect(() => {
    return watchCurrentPosition((pos) => setUserLocation(pos));
  }, []);

  // Resynchronise avec les points revalidés côté serveur.
  const [prevInitialPoints, setPrevInitialPoints] = useState(initialPoints);
  if (initialPoints !== prevInitialPoints) {
    setPrevInitialPoints(initialPoints);
    setPoints(initialPoints);
  }

  useEffect(() => {
    router.refresh();
  }, [router]);

  const handleBackgroundChange = useCallback((id: MapBackgroundId) => {
    saveTileLayer(id);
    setTileLayer(id);
    setIsLayersOpen(false);
  }, []);

  const handleToggleLayers = useCallback(() => {
    setIsFilterOpen(false);
    setIsLayersOpen((prev) => !prev);
  }, []);

  const handleToggleFilter = useCallback(() => {
    setIsLayersOpen(false);
    setIsFilterOpen((prev) => !prev);
  }, []);

  const handleToggleStatut = useCallback((statut: Statut) => {
    setVisibleStatuts((prev) =>
      prev.includes(statut)
        ? prev.filter((s) => s !== statut)
        : [...prev, statut]
    );
  }, []);

  const filteredPoints = useMemo(
    () => points.filter((point) => visibleStatuts.includes(point.statut)),
    [points, visibleStatuts]
  );

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch(`/api/zones/${zone.id}/points`);
      if (!res.ok) return;
      const fresh: FirePoint[] = await res.json();
      setPoints(fresh);
    } finally {
      setIsRefreshing(false);
    }
  }, [zone.id]);

  const handleMapLongPress = useCallback((lat: number, lng: number) => {
    setLongPressLocation({ lat, lng });
  }, []);

  const handleDismissLongPress = useCallback(() => {
    setLongPressLocation(null);
  }, []);

  useEffect(() => {
    if (longPressLocation == null) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleDismissLongPress();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [longPressLocation, handleDismissLongPress]);

  useEffect(() => {
    if (!isLayersOpen && !isFilterOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        controlsRef.current != null &&
        !controlsRef.current.contains(e.target as Node)
      ) {
        setIsLayersOpen(false);
        setIsFilterOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isLayersOpen, isFilterOpen]);

  return (
    <div className="relative h-dvh w-full overflow-hidden">
      <div className="absolute inset-0 z-0">
        <DynamicFireMap
          zoneId={zone.id}
          points={filteredPoints}
          features={features}
          center={[zone.centerLat, zone.centerLng]}
          zoom={zone.zoom}
          tileLayer={tileLayer}
          onLongPress={handleMapLongPress}
          userLocation={userLocation}
          flyToUserToken={flyToUserToken}
        />
      </div>

      {/* Décalé à droite pour ne pas recouvrir les contrôles de zoom Leaflet. */}
      <div className="absolute left-16 top-3 z-[500] max-w-[55%]">
        <Link
          href="/"
          className="block truncate rounded-xl border border-zinc-200 bg-white/95 px-4 py-3 text-sm font-semibold text-zinc-900 shadow-lg backdrop-blur focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2"
          tabIndex={0}
          aria-label={`Zone ${zone.name} — retour à l'accueil`}
        >
          🔥 {zone.name}
        </Link>
      </div>

      <div
        ref={controlsRef}
        className="absolute right-3 top-3 z-[500] flex flex-col items-end gap-2"
      >
        <div className="relative flex flex-row-reverse items-start gap-2">
          <button
            type="button"
            onClick={handleToggleLayers}
            className="flex min-h-[48px] min-w-[48px] shrink-0 items-center justify-center rounded-xl bg-zinc-900 p-3 text-white shadow-lg transition-colors hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 active:bg-zinc-800"
            aria-expanded={isLayersOpen}
            aria-haspopup="menu"
            aria-label="Fond de carte"
            tabIndex={0}
          >
            <Layers size={24} aria-hidden />
          </button>
          {isLayersOpen && (
            <div
              role="menu"
              className="absolute right-full top-0 mr-2 flex w-56 flex-col gap-1.5 rounded-xl border border-zinc-200 bg-white/95 p-4 shadow-lg backdrop-blur"
              aria-label="Fond de carte"
            >
              {MAP_BACKGROUND_IDS.map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => handleBackgroundChange(id)}
                  className={`flex min-h-[48px] items-center justify-between gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 ${
                    tileLayer === id
                      ? "bg-zinc-900 text-white"
                      : "bg-zinc-50 text-zinc-700 hover:bg-zinc-100 active:bg-zinc-200"
                  }`}
                  aria-pressed={tileLayer === id}
                  aria-label={`Fond : ${MAP_BACKGROUNDS[id].label}`}
                  tabIndex={0}
                >
                  {MAP_BACKGROUNDS[id].label}
                  {tileLayer === id ? (
                    <span className="text-emerald-400" aria-hidden>
                      ✓
                    </span>
                  ) : null}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="relative flex flex-row-reverse items-start gap-2">
          <button
            type="button"
            onClick={handleToggleFilter}
            className="flex min-h-[48px] min-w-[48px] shrink-0 items-center justify-center rounded-xl bg-zinc-900 p-3 text-white shadow-lg transition-colors hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 active:bg-zinc-800"
            aria-expanded={isFilterOpen}
            aria-haspopup="menu"
            aria-label="Filtrer les points par statut"
            tabIndex={0}
          >
            <Filter size={24} aria-hidden />
          </button>
          {isFilterOpen && (
            <div
              role="menu"
              className="absolute right-full top-0 mr-2 flex w-56 flex-col gap-4 rounded-xl border border-zinc-200 bg-white/95 p-4 shadow-lg backdrop-blur"
              aria-label="Filtre des points par statut"
            >
              <div
                role="group"
                aria-label="Statuts affichés"
                className="flex flex-col gap-2"
              >
                <span className="text-sm font-medium text-zinc-700">
                  Statuts affichés
                </span>
                <div className="flex flex-col gap-1.5">
                  {STATUT_KEYS.map((statut) => {
                    const isChecked = visibleStatuts.includes(statut);
                    return (
                      <button
                        key={statut}
                        type="button"
                        onClick={() => handleToggleStatut(statut)}
                        className={`flex min-h-[48px] items-center justify-between gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 ${
                          isChecked
                            ? "bg-zinc-900 text-white"
                            : "bg-zinc-50 text-zinc-700 hover:bg-zinc-100 active:bg-zinc-200"
                        }`}
                        aria-pressed={isChecked}
                        aria-label={`${isChecked ? "Masquer" : "Afficher"} les points « ${STATUT_LABELS[statut]} »`}
                        tabIndex={0}
                      >
                        {STATUT_LABELS[statut]}
                        <span
                          className={`min-w-[1.5rem] text-right ${
                            isChecked ? "text-emerald-400" : "text-zinc-400"
                          }`}
                          aria-hidden
                        >
                          {isChecked ? "✓" : "—"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
              <p className="text-xs text-zinc-500">
                {filteredPoints.length} point
                {filteredPoints.length !== 1 ? "s" : ""} affiché
                {filteredPoints.length !== 1 ? "s" : ""} sur {points.length}
              </p>
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex min-h-[48px] min-w-[48px] shrink-0 items-center justify-center rounded-xl bg-zinc-900 p-3 text-white shadow-lg transition-colors hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 active:bg-zinc-800"
          aria-label={
            isRefreshing
              ? "Rechargement en cours…"
              : "Recharger les points d'incendie"
          }
          tabIndex={0}
        >
          <RefreshIcon spinning={isRefreshing} />
        </button>
        {userLocation != null ? (
          <button
            type="button"
            onClick={() => setFlyToUserToken((t) => t + 1)}
            className="flex min-h-[48px] min-w-[48px] shrink-0 items-center justify-center rounded-xl bg-zinc-900 p-3 text-white shadow-lg transition-colors hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 active:bg-zinc-800"
            aria-label="Recentrer la carte sur ma position"
            tabIndex={0}
          >
            <LocateFixed size={24} aria-hidden />
          </button>
        ) : null}
      </div>

      <Link
        href={`/zone/${zone.id}/point/new`}
        className="absolute bottom-6 right-6 z-[1000] flex min-h-[56px] min-w-[56px] items-center justify-center rounded-full bg-red-600 text-3xl font-light text-white shadow-lg transition-colors hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 active:bg-red-700"
        tabIndex={0}
        aria-label="Signaler un point d'incendie"
      >
        +
      </Link>

      {longPressLocation != null ? (
        <div
          className="absolute inset-0 z-[1100] flex items-end justify-center bg-black/30 p-4 pb-8"
          role="dialog"
          aria-modal="true"
          aria-labelledby="long-press-title"
          aria-describedby="long-press-desc"
          onClick={(e) => {
            if (e.target === e.currentTarget) handleDismissLongPress();
          }}
        >
          <div
            className="flex w-full max-w-sm flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              id="long-press-title"
              className="text-lg font-semibold text-zinc-900"
            >
              Signaler un incendie ici ?
            </h2>
            <p id="long-press-desc" className="text-sm text-zinc-600">
              Vous pouvez signaler un nouveau point d&apos;incendie à cet
              emplacement sur la carte.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleDismissLongPress}
                className="min-h-[48px] flex-1 rounded-xl border border-zinc-300 bg-white px-4 font-medium text-zinc-700 transition-colors hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 active:bg-zinc-100"
                tabIndex={0}
                aria-label="Annuler"
              >
                Annuler
              </button>
              <Link
                href={`/zone/${zone.id}/point/new?lat=${longPressLocation.lat}&lng=${longPressLocation.lng}`}
                className="min-h-[48px] flex-1 rounded-xl bg-red-600 px-4 py-3 text-center font-semibold text-white transition-colors hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 active:bg-red-700"
                tabIndex={0}
                aria-label="Signaler un incendie à cet endroit"
              >
                Signaler
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
