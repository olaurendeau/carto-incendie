"use client";

import dynamic from "next/dynamic";
import { useCallback, useState } from "react";
import { getCurrentPosition } from "@/lib/geo";
import type { ZoneFormData } from "@/types/fire";

const DynamicMapPicker = dynamic(
  () =>
    import("@/components/map/MapPicker").then((m) => ({
      default: m.MapPicker,
    })),
  {
    ssr: false,
    loading: () => (
      <div
        className="flex items-center justify-center rounded-xl border border-zinc-200 bg-zinc-100 text-zinc-500"
        style={{ height: 300 }}
      >
        Chargement de la carte…
      </div>
    ),
  }
);

const ZOOM_DEFAULT = 13;

type ZoneFormProps = {
  initialData?: ZoneFormData;
  submitLabel: string;
  onSubmit: (data: ZoneFormData) => Promise<{ ok: boolean; error?: string }>;
};

export const ZoneForm = ({
  initialData,
  submitLabel,
  onSubmit,
}: ZoneFormProps) => {
  const [name, setName] = useState(initialData?.name ?? "");
  const [centerLat, setCenterLat] = useState<number | null>(
    initialData?.centerLat ?? null
  );
  const [centerLng, setCenterLng] = useState<number | null>(
    initialData?.centerLng ?? null
  );
  const [zoom, setZoom] = useState(initialData?.zoom ?? ZOOM_DEFAULT);
  const [isLocating, setIsLocating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSelectPosition = useCallback((lat: number, lng: number) => {
    setCenterLat(lat);
    setCenterLng(lng);
  }, []);

  // Le zoom de la zone suit celui de la mini-carte : l'admin cadre la vue par défaut.
  const handleZoomChange = useCallback((value: number) => {
    setZoom(value);
  }, []);

  const handleUseMyPosition = async () => {
    setIsLocating(true);
    setError(null);
    try {
      const pos = await getCurrentPosition();
      setCenterLat(pos.latitude);
      setCenterLng(pos.longitude);
    } catch {
      setError("Impossible de récupérer votre position.");
    } finally {
      setIsLocating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setError(null);

    if (!name.trim()) {
      setError("Le nom de la zone est obligatoire.");
      return;
    }
    if (centerLat == null || centerLng == null) {
      setError("Choisissez le centre de la zone sur la carte.");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await onSubmit({
        name: name.trim(),
        centerLat,
        centerLng,
        zoom,
      });
      if (!result.ok) {
        setError(result.error ?? "Une erreur est survenue.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const position =
    centerLat != null && centerLng != null
      ? { latitude: centerLat, longitude: centerLng }
      : null;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <label
          htmlFor="zone-name"
          className="text-sm font-medium text-zinc-700"
        >
          Nom de la zone
        </label>
        <input
          id="zone-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex. : Feu de la colline de Berre"
          className="min-h-[48px] rounded-xl border border-zinc-300 bg-white px-4 text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-400"
          required
        />
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-zinc-700">
          Centre et niveau de zoom de la zone
        </span>
        <p className="text-sm text-zinc-500">
          Touchez la carte pour placer le centre, ajustez le zoom : c&apos;est
          la vue par défaut que verront les utilisateurs.
        </p>
        <DynamicMapPicker
          position={position}
          initialZoom={zoom}
          onSelect={handleSelectPosition}
          onZoomChange={handleZoomChange}
        />
        <div className="flex items-center justify-between text-sm text-zinc-600">
          <span>
            {position
              ? `${position.latitude.toFixed(5)}, ${position.longitude.toFixed(5)}`
              : "Aucun centre sélectionné"}
          </span>
          <span>Zoom : {zoom}</span>
        </div>
        <button
          type="button"
          onClick={handleUseMyPosition}
          disabled={isLocating}
          className="flex min-h-[48px] items-center justify-center gap-2 rounded-xl border-2 border-zinc-300 bg-white px-4 text-sm font-medium text-zinc-700 hover:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
          tabIndex={0}
          aria-label="Utiliser ma position comme centre de la zone"
        >
          {isLocating ? "Localisation…" : "📍 Utiliser ma position"}
        </button>
      </div>

      {error ? (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700" role="alert">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="min-h-[52px] rounded-xl bg-red-600 px-4 font-semibold text-white transition-colors hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-60 active:bg-red-700"
        tabIndex={0}
      >
        {isSubmitting ? "Enregistrement…" : submitLabel}
      </button>
    </form>
  );
};
