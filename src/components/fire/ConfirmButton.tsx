"use client";

import { useState } from "react";
import { confirmFirePointAction } from "@/lib/db/actions";
import { hasConfirmedPoint, markPointConfirmed } from "@/lib/storage";

type ConfirmButtonProps = {
  pointId: string;
  confirmations: number;
};

/**
 * Confirmation « + » d'un point d'incendie.
 * Une seule confirmation par navigateur (flag localStorage).
 * Rendu uniquement côté client (popup de FireMap, ssr:false) :
 * la lecture localStorage à l'initialisation est sûre.
 */
export const ConfirmButton = ({
  pointId,
  confirmations: initialConfirmations,
}: ConfirmButtonProps) => {
  const [confirmations, setConfirmations] = useState(initialConfirmations);
  const [isConfirmed, setIsConfirmed] = useState(() =>
    hasConfirmedPoint(pointId)
  );
  const [isPending, setIsPending] = useState(false);

  // Resynchronise le compteur quand le serveur renvoie des points rafraîchis.
  const [prevInitial, setPrevInitial] = useState(initialConfirmations);
  if (initialConfirmations !== prevInitial) {
    setPrevInitial(initialConfirmations);
    setConfirmations(initialConfirmations);
  }

  const handleConfirm = async () => {
    if (isConfirmed || isPending) return;
    setIsPending(true);
    // Optimiste : on marque localement avant la réponse serveur.
    setIsConfirmed(true);
    setConfirmations((prev) => prev + 1);
    markPointConfirmed(pointId);
    try {
      const result = await confirmFirePointAction(pointId);
      if (result.ok) {
        setConfirmations(result.confirmations);
      }
    } finally {
      setIsPending(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleConfirm}
      disabled={isConfirmed || isPending}
      className={`inline-flex min-h-[32px] items-center justify-center gap-1 rounded-lg px-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 ${
        isConfirmed
          ? "cursor-default bg-emerald-100 text-emerald-700"
          : "bg-zinc-900 !text-white hover:bg-zinc-700"
      }`}
      tabIndex={0}
      aria-label={
        isConfirmed
          ? "Vous avez confirmé ce point d'incendie"
          : "Confirmer ce point d'incendie"
      }
    >
      {isConfirmed ? `Confirmé ✓ (${confirmations})` : `+1 (${confirmations})`}
    </button>
  );
};
