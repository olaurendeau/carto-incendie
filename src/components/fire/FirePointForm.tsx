"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { PhotosSection } from "@/components/fire/PhotosSection";
import {
  createFirePointAction,
  updateFirePointAction,
} from "@/lib/db/actions";
import { getCurrentPosition } from "@/lib/geo";
import { getStoredIdentity, saveIdentity } from "@/lib/storage";
import {
  CRITICITE_COLORS,
  CRITICITE_KEYS,
  CRITICITE_LABELS,
  QUALITE_KEYS,
  QUALITE_LABELS,
  STATUT_KEYS,
  STATUT_LABELS,
  type Criticite,
  type FirePhotoJson,
  type FirePointFormData,
  type Qualite,
  type Statut,
} from "@/types/fire";

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
        style={{ height: 220 }}
      >
        Chargement de la carte…
      </div>
    ),
  }
);

type FirePointFormProps = {
  zoneId: string;
  /** Défini en mode édition. */
  pointId?: string;
  initialLocation?: { latitude: number; longitude: number } | null;
  initialData?: FirePointFormData;
};

export const FirePointForm = ({
  zoneId,
  pointId,
  initialLocation,
  initialData,
}: FirePointFormProps) => {
  const router = useRouter();
  const isEdit = pointId != null;

  const [latitude, setLatitude] = useState<number | null>(
    initialData?.latitude ?? initialLocation?.latitude ?? null
  );
  const [longitude, setLongitude] = useState<number | null>(
    initialData?.longitude ?? initialLocation?.longitude ?? null
  );
  const [criticite, setCriticite] = useState<Criticite | null>(
    initialData?.criticite ?? null
  );
  const [statut, setStatut] = useState<Statut>(initialData?.statut ?? "en_cours");
  const [note, setNote] = useState(initialData?.note ?? "");
  const [photos, setPhotos] = useState<FirePhotoJson[]>(
    initialData?.photos ?? []
  );
  const [creatorName, setCreatorName] = useState(
    initialData?.creatorName ?? ""
  );
  const [creatorQualite, setCreatorQualite] = useState<Qualite | null>(
    initialData?.creatorQualite ?? null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Identité persistée en localStorage (pas de login) : préremplissage.
  // Fait dans un effet (et non à l'init du state) car le formulaire est rendu
  // côté serveur, où localStorage n'existe pas — un init différent créerait un
  // mismatch d'hydratation sur la valeur des champs.
  useEffect(() => {
    if (isEdit) return;
    const identity = getStoredIdentity();
    if (!identity) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCreatorName((prev) => prev || identity.name);
    setCreatorQualite((prev) => prev ?? identity.qualite);
  }, [isEdit]);

  // Sans position initiale (bouton « + »), on tente la géolocalisation.
  useEffect(() => {
    if (isEdit || initialLocation != null) return;
    getCurrentPosition()
      .then((pos) => {
        setLatitude((prev) => prev ?? pos.latitude);
        setLongitude((prev) => prev ?? pos.longitude);
      })
      .catch(() => {
        // L'utilisateur placera le point sur la mini-carte.
      });
  }, [isEdit, initialLocation]);

  const handleSelectPosition = useCallback((lat: number, lng: number) => {
    setLatitude(lat);
    setLongitude(lng);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setError(null);

    if (latitude == null || longitude == null) {
      setError("Placez le point d'incendie sur la carte.");
      return;
    }
    if (!criticite) {
      setError("Choisissez une criticité.");
      return;
    }

    setIsSubmitting(true);
    try {
      saveIdentity({ name: creatorName.trim(), qualite: creatorQualite });

      const data: FirePointFormData = {
        latitude,
        longitude,
        criticite,
        statut,
        note,
        photos,
        creatorName,
        creatorQualite,
      };

      const result = isEdit
        ? await updateFirePointAction(pointId, data)
        : await createFirePointAction(zoneId, data);

      if (!result.ok) {
        setError(result.error);
        return;
      }

      router.push(`/zone/${zoneId}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const position =
    latitude != null && longitude != null ? { latitude, longitude } : null;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <section className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-lg font-semibold text-zinc-900">
          Emplacement
        </h2>
        <DynamicMapPicker
          position={position}
          initialZoom={15}
          onSelect={handleSelectPosition}
          height={220}
        />
        <p className="mt-2 text-sm text-zinc-500">
          {position
            ? `${position.latitude.toFixed(5)}, ${position.longitude.toFixed(5)}`
            : "Touchez la carte pour placer le point."}
        </p>
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-lg font-semibold text-zinc-900">Criticité</h2>
        <div className="flex flex-col gap-2 sm:flex-row">
          {CRITICITE_KEYS.map((key) => {
            const isSelected = criticite === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setCriticite(key)}
                className={`min-h-[56px] flex-1 rounded-xl border-2 px-4 font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  isSelected
                    ? "border-transparent text-white"
                    : "border-zinc-300 bg-white text-zinc-700 hover:border-zinc-500"
                }`}
                style={
                  isSelected
                    ? { backgroundColor: CRITICITE_COLORS[key] }
                    : undefined
                }
                aria-pressed={isSelected}
                aria-label={`Criticité : ${CRITICITE_LABELS[key]}`}
                tabIndex={0}
              >
                {CRITICITE_LABELS[key]}
              </button>
            );
          })}
        </div>
      </section>

      {isEdit ? (
        <section className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-lg font-semibold text-zinc-900">Statut</h2>
          <div className="flex gap-2">
            {STATUT_KEYS.map((key) => {
              const isSelected = statut === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setStatut(key)}
                  className={`min-h-[48px] flex-1 rounded-xl border-2 px-4 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 ${
                    isSelected
                      ? key === "traite"
                        ? "border-transparent bg-emerald-600 text-white"
                        : "border-transparent bg-red-600 text-white"
                      : "border-zinc-300 bg-white text-zinc-700 hover:border-zinc-500"
                  }`}
                  aria-pressed={isSelected}
                  aria-label={`Statut : ${STATUT_LABELS[key]}`}
                  tabIndex={0}
                >
                  {STATUT_LABELS[key]}
                </button>
              );
            })}
          </div>
        </section>
      ) : null}

      <section className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-lg font-semibold text-zinc-900">Note</h2>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={4}
          placeholder="Décrivez ce que vous observez : accès, vent, végétation…"
          className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-400"
        />
      </section>

      <PhotosSection value={photos} onChange={setPhotos} />

      <section className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-lg font-semibold text-zinc-900">
          Qui êtes-vous ?
        </h2>
        <p className="mb-3 text-sm text-zinc-600">
          Pas de compte : votre nom et votre qualité sont mémorisés sur cet
          appareil.
        </p>
        <div className="flex flex-col gap-3">
          <input
            type="text"
            value={creatorName}
            onChange={(e) => setCreatorName(e.target.value)}
            placeholder="Votre nom"
            className="min-h-[48px] rounded-xl border border-zinc-300 bg-white px-4 text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-400"
            aria-label="Votre nom"
          />
          <div className="grid grid-cols-2 gap-2">
            {QUALITE_KEYS.map((key) => {
              const isSelected = creatorQualite === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() =>
                    setCreatorQualite(isSelected ? null : key)
                  }
                  className={`min-h-[48px] rounded-xl border-2 px-4 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 ${
                    isSelected
                      ? "border-transparent bg-zinc-900 text-white"
                      : "border-zinc-300 bg-white text-zinc-700 hover:border-zinc-500"
                  }`}
                  aria-pressed={isSelected}
                  aria-label={`Qualité : ${QUALITE_LABELS[key]}`}
                  tabIndex={0}
                >
                  {QUALITE_LABELS[key]}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {error ? (
        <p
          className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="min-h-[52px] rounded-xl bg-red-600 px-4 font-semibold text-white transition-colors hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-60 active:bg-red-700"
        tabIndex={0}
      >
        {isSubmitting
          ? "Enregistrement…"
          : isEdit
            ? "Enregistrer les modifications"
            : "Signaler le point d'incendie"}
      </button>
    </form>
  );
};
