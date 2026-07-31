"use client";

import { X } from "lucide-react";
import { useEffect, useState } from "react";
import type { ZoneFeatureEvent } from "@/lib/db/schema";
import {
  FEATURE_EVENT_ACTION_LABELS,
  FEATURE_KIND_LABELS,
  QUALITE_LABELS,
  type FeatureEventAction,
} from "@/types/fire";

// Les dates arrivent sérialisées en string via JSON.
type SerializedEvent = Omit<ZoneFeatureEvent, "createdAt"> & {
  createdAt: string;
};

type FeatureHistoryPanelProps = {
  zoneId: string;
  open: boolean;
  onClose: () => void;
};

const ACTION_DOT_CLASSES: Record<FeatureEventAction, string> = {
  creation: "bg-emerald-500",
  modification: "bg-amber-500",
  suppression: "bg-red-500",
};

const formatEventDate = (value: string): string =>
  new Date(value).toLocaleString("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  });

/** Historique des changements d'annotations, rechargé à chaque ouverture. */
export const FeatureHistoryPanel = ({
  zoneId,
  open,
  onClose,
}: FeatureHistoryPanelProps) => {
  const [events, setEvents] = useState<SerializedEvent[] | null>(null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    // Réinitialisation à chaque ouverture (état de chargement propre).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEvents(null);
    setHasError(false);
    fetch(`/api/zones/${zoneId}/feature-events`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<SerializedEvent[]>;
      })
      .then((data) => {
        if (!cancelled) setEvents(data);
      })
      .catch(() => {
        if (!cancelled) setHasError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [open, zoneId]);

  if (!open) return null;

  return (
    <div
      className="absolute inset-0 z-[1100] flex items-end justify-center bg-black/30 p-4 pb-8"
      role="dialog"
      aria-modal="true"
      aria-labelledby="history-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="flex max-h-[75dvh] w-full max-w-sm flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-5 shadow-xl">
        <div className="flex items-center justify-between gap-2">
          <h2 id="history-title" className="text-lg font-semibold text-zinc-900">
            Historique des annotations
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex min-h-[40px] min-w-[40px] items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-500"
            tabIndex={0}
            aria-label="Fermer l'historique"
          >
            <X size={20} aria-hidden />
          </button>
        </div>

        {hasError ? (
          <p className="text-sm text-red-600" role="alert">
            Impossible de charger l&apos;historique. Réessayez.
          </p>
        ) : events == null ? (
          <p className="text-sm text-zinc-500">Chargement…</p>
        ) : events.length === 0 ? (
          <p className="text-sm text-zinc-500">Aucun changement pour l&apos;instant.</p>
        ) : (
          <ul className="flex flex-col gap-3 overflow-y-auto">
            {events.map((event) => (
              <li key={event.id} className="flex gap-3">
                <span
                  className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${ACTION_DOT_CLASSES[event.action]}`}
                  aria-hidden
                />
                <div className="min-w-0 text-sm">
                  <p className="text-zinc-900">
                    <span className="font-medium">
                      {FEATURE_EVENT_ACTION_LABELS[event.action]}
                    </span>{" "}
                    —{" "}
                    <span className="break-words">
                      {event.featureLabel ||
                        FEATURE_KIND_LABELS[event.featureKind]}
                    </span>
                  </p>
                  <p className="text-xs text-zinc-500">
                    {event.authorName
                      ? `par ${event.authorName}${
                          event.authorQualite
                            ? ` · ${QUALITE_LABELS[event.authorQualite]}`
                            : ""
                        }`
                      : "Anonyme"}{" "}
                    · {formatEventDate(event.createdAt)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
