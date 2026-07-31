"use client";

import { History } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { FeatureDraft } from "@/components/annotations/editor-types";
import { FeatureHistoryPanel } from "@/components/annotations/FeatureHistoryPanel";
import { IdentityFields } from "@/components/IdentityFields";
import type { EditorMode } from "@/components/map/GeomanController";
import {
  createZoneFeatureAction,
  deleteZoneFeatureAction,
  updateZoneFeatureAction,
} from "@/lib/db/actions";
import type { FirePoint, PublicZone, ZoneFeature } from "@/lib/db/schema";
import { getStoredIdentity, saveIdentity } from "@/lib/storage";
import {
  FEATURE_GEOMETRY_KEYS,
  FEATURE_GEOMETRY_LABELS,
  FEATURE_KIND_COLORS,
  FEATURE_KIND_DESCRIPTIONS,
  FEATURE_KIND_GEOMETRY,
  FEATURE_KIND_KEYS,
  FEATURE_KIND_LABELS,
  QUALITE_LABELS,
  type FeatureGeometry,
  type FeatureKind,
  type LatLngPoint,
  type Qualite,
} from "@/types/fire";

const DynamicAnnotationsMap = dynamic(
  () =>
    import("@/components/map/AnnotationsMap").then((m) => ({
      default: m.AnnotationsMap,
    })),
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

const PALETTE = ["#7c3aed", "#0891b2", "#16a34a", "#ca8a04", "#db2777"];

const KIND_BUTTON_LABELS: Record<FeatureKind, string> = {
  main_courante: "+ Main courante",
  zone_risque_pierres: "+ Zone à risque",
  autre: "+ Autre",
};

type AnnotationsEditorProps = {
  zone: PublicZone;
  /** Token admin ; null = mode public (ajout uniquement, pas de modification/suppression). */
  token?: string | null;
  initialFeatures: ZoneFeature[];
  firePoints: FirePoint[];
};

export const AnnotationsEditor = ({
  zone,
  token = null,
  initialFeatures,
  firePoints,
}: AnnotationsEditorProps) => {
  const isAdmin = token != null;
  const [features, setFeatures] = useState<ZoneFeature[]>(initialFeatures);
  const [mode, setMode] = useState<EditorMode>("idle");
  const [draft, setDraft] = useState<FeatureDraft | null>(null);
  const [rebuildToken, setRebuildToken] = useState(0);
  const [error, setError] = useState<string | null>(null);
  // Toast éphémère : les enregistrements sont immédiats, on le rend visible.
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  // Bottom-sheet de création (métadonnées avant le tracé).
  const [sheetKind, setSheetKind] = useState<FeatureKind | null>(null);
  const [sheetLabel, setSheetLabel] = useState("");
  const [sheetNote, setSheetNote] = useState("");
  const [sheetGeometry, setSheetGeometry] = useState<FeatureGeometry>("ligne");
  const [sheetColor, setSheetColor] = useState<string>(
    FEATURE_KIND_COLORS.autre
  );
  const [pendingRemovalId, setPendingRemovalId] = useState<string | null>(null);
  // Fiche d'édition ouverte par un tap sur une annotation (mode idle).
  const [editingFeatureId, setEditingFeatureId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editNote, setEditNote] = useState("");
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  // Identité déclarative partagée par toutes les actions de l'écran.
  const [identityName, setIdentityName] = useState("");
  const [identityQualite, setIdentityQualite] = useState<Qualite | null>(null);

  // Préremplissage localStorage en effet (jamais à l'init : hydratation).
  useEffect(() => {
    const stored = getStoredIdentity();
    if (!stored) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIdentityName(stored.name);
    setIdentityQualite(stored.qualite);
  }, []);

  /** Auteur courant, mémorisé sur l'appareil au passage. */
  const commitAuthor = useCallback(() => {
    const author = { name: identityName.trim(), qualite: identityQualite };
    saveIdentity(author);
    return author;
  }, [identityName, identityQualite]);

  useEffect(() => {
    if (error == null) return;
    const id = setTimeout(() => setError(null), 6000);
    return () => clearTimeout(id);
  }, [error]);

  useEffect(() => {
    if (savedMessage == null) return;
    const id = setTimeout(() => setSavedMessage(null), 2500);
    return () => clearTimeout(id);
  }, [savedMessage]);

  const forceRebuild = useCallback(() => setRebuildToken((t) => t + 1), []);

  const handleOpenSheet = (kind: FeatureKind) => {
    setMode("idle");
    setSheetKind(kind);
    setSheetLabel("");
    setSheetNote("");
    setSheetGeometry(FEATURE_KIND_GEOMETRY[kind] ?? "ligne");
    setSheetColor(FEATURE_KIND_COLORS.autre);
  };

  const handleStartDraw = () => {
    if (sheetKind == null) return;
    setDraft({
      kind: sheetKind,
      geometryType: FEATURE_KIND_GEOMETRY[sheetKind] ?? sheetGeometry,
      label: sheetLabel,
      note: sheetNote,
      color: sheetKind === "autre" ? sheetColor : null,
    });
    setSheetKind(null);
    setMode("draw");
  };

  const handleCreate = useCallback(
    async (coordinates: LatLngPoint[]) => {
      setMode("idle");
      if (draft == null) return;
      const result = await createZoneFeatureAction(
        zone.id,
        { ...draft, coordinates },
        commitAuthor()
      );
      if (result.ok) {
        setFeatures((prev) => [result.feature, ...prev]);
        setSavedMessage("Annotation enregistrée");
      } else {
        setError(result.error);
      }
      setDraft(null);
    },
    [draft, zone.id, commitAuthor]
  );

  const handleUpdate = useCallback(
    async (featureId: string, coordinates: LatLngPoint[]) => {
      const feature = features.find((f) => f.id === featureId);
      if (!feature) return;
      const result = await updateZoneFeatureAction(
        featureId,
        {
          kind: feature.kind,
          geometryType: feature.geometryType,
          coordinates,
          label: feature.label ?? "",
          note: feature.note ?? "",
          color: feature.color,
        },
        commitAuthor()
      );
      if (result.ok) {
        setFeatures((prev) =>
          prev.map((f) => (f.id === featureId ? result.feature : f))
        );
        setSavedMessage("Modifications enregistrées");
      } else {
        setError(result.error);
        forceRebuild();
      }
    },
    [features, commitAuthor, forceRebuild]
  );

  const handleSelect = useCallback(
    (featureId: string) => {
      const feature = features.find((f) => f.id === featureId);
      if (!feature) return;
      setEditLabel(feature.label ?? "");
      setEditNote(feature.note ?? "");
      setEditingFeatureId(featureId);
    },
    [features]
  );

  const editingFeature =
    editingFeatureId != null
      ? features.find((f) => f.id === editingFeatureId) ?? null
      : null;

  const handleSaveEdit = async () => {
    if (editingFeature == null) return;
    const result = await updateZoneFeatureAction(
      editingFeature.id,
      {
        kind: editingFeature.kind,
        geometryType: editingFeature.geometryType,
        coordinates: editingFeature.coordinates,
        label: editLabel,
        note: editNote,
        color: editingFeature.color,
      },
      commitAuthor()
    );
    if (result.ok) {
      setFeatures((prev) =>
        prev.map((f) => (f.id === editingFeature.id ? result.feature : f))
      );
      setSavedMessage("Modifications enregistrées");
      setEditingFeatureId(null);
    } else {
      setError(result.error);
    }
  };

  const handleRemoveRequest = useCallback((featureId: string) => {
    setPendingRemovalId(featureId);
  }, []);

  const handleConfirmRemoval = async () => {
    if (pendingRemovalId == null) return;
    const id = pendingRemovalId;
    setPendingRemovalId(null);
    const result = await deleteZoneFeatureAction(id, commitAuthor());
    if (result.ok) {
      setFeatures((prev) => prev.filter((f) => f.id !== id));
      setSavedMessage("Annotation supprimée");
    } else {
      setError(result.error);
      forceRebuild();
    }
  };

  const handleCancelRemoval = () => {
    setPendingRemovalId(null);
    // La couche a déjà été retirée par geoman : on la fait réapparaître.
    forceRebuild();
  };

  const pendingRemovalFeature =
    pendingRemovalId != null
      ? features.find((f) => f.id === pendingRemovalId) ?? null
      : null;

  const toggleMode = (target: EditorMode) => {
    setMode((prev) => (prev === target ? "idle" : target));
  };

  return (
    <div className="relative h-dvh w-full overflow-hidden">
      <div className="absolute inset-0 z-0">
        <DynamicAnnotationsMap
          zone={zone}
          firePoints={firePoints}
          features={features}
          mode={mode}
          draft={draft}
          rebuildToken={rebuildToken}
          onCreate={handleCreate}
          onUpdate={handleUpdate}
          onRemoveRequest={handleRemoveRequest}
          onSelect={handleSelect}
        />
      </div>

      <button
        type="button"
        onClick={() => setIsHistoryOpen(true)}
        className="absolute right-3 top-3 z-[500] flex min-h-[48px] min-w-[48px] items-center justify-center rounded-xl bg-zinc-900 p-3 text-white shadow-lg transition-colors hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 active:bg-zinc-800"
        tabIndex={0}
        aria-label="Voir l'historique des annotations"
      >
        <History size={24} aria-hidden />
      </button>

      {/* Décalé à droite pour ne pas recouvrir les contrôles de zoom Leaflet,
          et borné pour laisser la place au bouton Historique. */}
      <div className="absolute left-16 top-3 z-[500] max-w-[55%]">
        <Link
          href={
            isAdmin ? `/zone/${zone.id}/edit?token=${token}` : `/zone/${zone.id}`
          }
          className="block truncate rounded-xl border border-zinc-200 bg-white/95 px-4 py-3 text-sm font-semibold text-zinc-900 shadow-lg backdrop-blur focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2"
          tabIndex={0}
          aria-label={
            isAdmin
              ? "Retour à l'édition de la zone"
              : "Retour à la carte de la zone"
          }
        >
          ← Annotations · {zone.name}
        </Link>
      </div>

      {error ? (
        <div
          className="absolute inset-x-4 top-20 z-[1200] rounded-xl bg-red-600 px-4 py-3 text-sm font-medium text-white shadow-lg"
          role="alert"
        >
          {error}
        </div>
      ) : savedMessage ? (
        <div
          className="absolute inset-x-4 top-20 z-[1200] rounded-xl bg-emerald-600 px-4 py-3 text-center text-sm font-medium text-white shadow-lg"
          role="status"
          aria-live="polite"
        >
          ✓ {savedMessage}
        </div>
      ) : null}

      {mode === "edit" ? (
        <p className="absolute inset-x-4 top-20 z-[500] rounded-xl bg-white/95 px-4 py-2 text-center text-sm text-zinc-700 shadow backdrop-blur">
          Déplacez les sommets ou les tracés, puis touchez « Terminer » pour
          enregistrer.
        </p>
      ) : null}
      {mode === "remove" ? (
        <p className="absolute inset-x-4 top-20 z-[500] rounded-xl bg-white/95 px-4 py-2 text-center text-sm text-zinc-700 shadow backdrop-blur">
          Touchez une annotation pour la supprimer.
        </p>
      ) : null}

      <div className="absolute inset-x-3 bottom-4 z-[500]">
        {mode === "draw" ? (
          <button
            type="button"
            onClick={() => {
              setMode("idle");
              setDraft(null);
            }}
            className="flex min-h-[52px] w-full items-center justify-center rounded-xl bg-zinc-900 px-4 font-semibold text-white shadow-lg transition-colors hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2"
            tabIndex={0}
            aria-label="Annuler le tracé en cours"
          >
            Annuler le tracé
          </button>
        ) : (
          <div className="flex flex-wrap justify-center gap-2">
            {FEATURE_KIND_KEYS.map((kind) => (
              <button
                key={kind}
                type="button"
                onClick={() => handleOpenSheet(kind)}
                className="min-h-[48px] flex-1 basis-[30%] rounded-xl bg-zinc-900 px-3 text-sm font-medium text-white shadow-lg transition-colors hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2"
                tabIndex={0}
                aria-label={`Ajouter : ${FEATURE_KIND_LABELS[kind]}`}
              >
                {KIND_BUTTON_LABELS[kind]}
              </button>
            ))}
            <button
                  type="button"
                  onClick={() => toggleMode("edit")}
                  className={`min-h-[48px] flex-1 basis-[45%] rounded-xl px-3 text-sm font-medium shadow-lg transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 ${
                    mode === "edit"
                      ? "bg-emerald-600 text-white hover:bg-emerald-500"
                      : "bg-white text-zinc-900 hover:bg-zinc-100"
                  }`}
                  aria-pressed={mode === "edit"}
                  tabIndex={0}
                  aria-label={
                    mode === "edit"
                      ? "Terminer la modification des tracés"
                      : "Modifier les tracés"
                  }
                >
                  {mode === "edit" ? "Terminer ✓" : "Modifier les tracés"}
                </button>
                <button
                  type="button"
                  onClick={() => toggleMode("remove")}
                  className={`min-h-[48px] flex-1 basis-[45%] rounded-xl px-3 text-sm font-medium shadow-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 ${
                    mode === "remove"
                      ? "bg-red-600 text-white hover:bg-red-500"
                      : "bg-white text-red-700 hover:bg-red-50"
                  }`}
                  aria-pressed={mode === "remove"}
                  tabIndex={0}
                  aria-label={
                    mode === "remove"
                      ? "Quitter le mode suppression"
                      : "Supprimer des annotations"
                  }
                >
                  {mode === "remove" ? "Terminer ✓" : "Supprimer"}
                </button>
          </div>
        )}
      </div>

      {sheetKind != null ? (
        <div
          className="absolute inset-0 z-[1100] flex items-end justify-center bg-black/30 p-4 pb-8"
          role="dialog"
          aria-modal="true"
          aria-labelledby="sheet-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSheetKind(null);
          }}
        >
          <div className="flex w-full max-w-sm flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-xl">
            <div>
              <h2
                id="sheet-title"
                className="text-lg font-semibold text-zinc-900"
              >
                {FEATURE_KIND_LABELS[sheetKind]}
              </h2>
              <p className="mt-1 text-sm text-zinc-600">
                {FEATURE_KIND_DESCRIPTIONS[sheetKind]}
              </p>
            </div>

            {sheetKind === "autre" ? (
              <div className="flex flex-col gap-3">
                <div className="flex gap-2">
                  {FEATURE_GEOMETRY_KEYS.map((geom) => (
                    <button
                      key={geom}
                      type="button"
                      onClick={() => setSheetGeometry(geom)}
                      className={`min-h-[48px] flex-1 rounded-xl border-2 px-4 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 ${
                        sheetGeometry === geom
                          ? "border-transparent bg-zinc-900 text-white"
                          : "border-zinc-300 bg-white text-zinc-700 hover:border-zinc-500"
                      }`}
                      aria-pressed={sheetGeometry === geom}
                      tabIndex={0}
                    >
                      {FEATURE_GEOMETRY_LABELS[geom]}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  {PALETTE.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setSheetColor(color)}
                      className={`h-9 w-9 rounded-full border-2 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 ${
                        sheetColor === color
                          ? "border-zinc-900"
                          : "border-transparent"
                      }`}
                      style={{ backgroundColor: color }}
                      aria-label={`Couleur ${color}`}
                      aria-pressed={sheetColor === color}
                      tabIndex={0}
                    />
                  ))}
                  <input
                    type="color"
                    value={sheetColor}
                    onChange={(e) => setSheetColor(e.target.value)}
                    className="h-9 w-9 cursor-pointer rounded-full border border-zinc-300"
                    aria-label="Couleur personnalisée"
                  />
                </div>
              </div>
            ) : null}

            <input
              type="text"
              value={sheetLabel}
              onChange={(e) => setSheetLabel(e.target.value)}
              placeholder="Libellé (facultatif)"
              maxLength={120}
              className="min-h-[48px] rounded-xl border border-zinc-300 bg-white px-4 text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-400"
              aria-label="Libellé de l'annotation"
            />

            <textarea
              value={sheetNote}
              onChange={(e) => setSheetNote(e.target.value)}
              rows={4}
              maxLength={2000}
              placeholder="Note (facultatif) — précisions, consignes…"
              className="rounded-xl border border-zinc-300 bg-white px-4 py-3 text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-400"
              aria-label="Note de l'annotation"
            />

            <IdentityFields
              hint
              name={identityName}
              qualite={identityQualite}
              onNameChange={setIdentityName}
              onQualiteChange={setIdentityQualite}
            />

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setSheetKind(null)}
                className="min-h-[48px] flex-1 rounded-xl border border-zinc-300 bg-white px-4 font-medium text-zinc-700 transition-colors hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2"
                tabIndex={0}
                aria-label="Annuler"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleStartDraw}
                className="min-h-[48px] flex-1 rounded-xl bg-zinc-900 px-4 font-semibold text-white transition-colors hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2"
                tabIndex={0}
                aria-label="Commencer le tracé sur la carte"
              >
                Commencer le tracé
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {pendingRemovalFeature != null ? (
        <div
          className="absolute inset-0 z-[1100] flex items-end justify-center bg-black/30 p-4 pb-8"
          role="dialog"
          aria-modal="true"
          aria-labelledby="removal-title"
        >
          <div className="flex w-full max-w-sm flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-xl">
            <h2
              id="removal-title"
              className="text-lg font-semibold text-zinc-900"
            >
              Supprimer cette annotation ?
            </h2>
            <p className="text-sm text-zinc-600">
              {pendingRemovalFeature.label ||
                FEATURE_KIND_LABELS[pendingRemovalFeature.kind]}{" "}
              — cette action est irréversible.
            </p>
            <IdentityFields
              hint
              name={identityName}
              qualite={identityQualite}
              onNameChange={setIdentityName}
              onQualiteChange={setIdentityQualite}
            />
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleCancelRemoval}
                className="min-h-[48px] flex-1 rounded-xl border border-zinc-300 bg-white px-4 font-medium text-zinc-700 transition-colors hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2"
                tabIndex={0}
                aria-label="Annuler la suppression"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleConfirmRemoval}
                className="min-h-[48px] flex-1 rounded-xl bg-red-600 px-4 font-semibold text-white transition-colors hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                tabIndex={0}
                aria-label="Confirmer la suppression"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {editingFeature != null ? (
        <div
          className="absolute inset-0 z-[1100] flex items-end justify-center bg-black/30 p-4 pb-8"
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-sheet-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) setEditingFeatureId(null);
          }}
        >
          <div className="flex max-h-[85dvh] w-full max-w-sm flex-col gap-4 overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-5 shadow-xl">
            <div>
              <h2
                id="edit-sheet-title"
                className="text-lg font-semibold text-zinc-900"
              >
                {editingFeature.label ||
                  FEATURE_KIND_LABELS[editingFeature.kind]}
              </h2>
              <p className="mt-1 text-sm text-zinc-600">
                {FEATURE_KIND_LABELS[editingFeature.kind]}
                {editingFeature.creatorName || editingFeature.creatorQualite
                  ? ` — ajoutée par ${
                      editingFeature.creatorName || "anonyme"
                    }${
                      editingFeature.creatorQualite
                        ? ` · ${QUALITE_LABELS[editingFeature.creatorQualite]}`
                        : ""
                    }`
                  : ""}
              </p>
            </div>

            <input
              type="text"
              value={editLabel}
              onChange={(e) => setEditLabel(e.target.value)}
              placeholder="Libellé (facultatif)"
              maxLength={120}
              className="min-h-[48px] rounded-xl border border-zinc-300 bg-white px-4 text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-400"
              aria-label="Libellé de l'annotation"
            />

            <textarea
              value={editNote}
              onChange={(e) => setEditNote(e.target.value)}
              rows={6}
              maxLength={2000}
              placeholder="Note (facultatif) — précisions, consignes…"
              className="rounded-xl border border-zinc-300 bg-white px-4 py-3 text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-400"
              aria-label="Note de l'annotation"
            />

            <IdentityFields
              hint
              name={identityName}
              qualite={identityQualite}
              onNameChange={setIdentityName}
              onQualiteChange={setIdentityQualite}
            />

            <div className="flex flex-col gap-3">
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setEditingFeatureId(null)}
                  className="min-h-[48px] flex-1 rounded-xl border border-zinc-300 bg-white px-4 font-medium text-zinc-700 transition-colors hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2"
                  tabIndex={0}
                  aria-label="Annuler les modifications"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  className="min-h-[48px] flex-1 rounded-xl bg-zinc-900 px-4 font-semibold text-white transition-colors hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2"
                  tabIndex={0}
                  aria-label="Enregistrer les modifications"
                >
                  Enregistrer
                </button>
              </div>
              <button
                type="button"
                onClick={() => {
                  const id = editingFeature.id;
                  setEditingFeatureId(null);
                  setPendingRemovalId(id);
                }}
                className="min-h-[48px] rounded-xl border border-red-200 bg-red-50 px-4 font-medium text-red-700 transition-colors hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                tabIndex={0}
                aria-label="Supprimer cette annotation"
              >
                Supprimer cette annotation
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <FeatureHistoryPanel
        zoneId={zone.id}
        open={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
      />
    </div>
  );
};
