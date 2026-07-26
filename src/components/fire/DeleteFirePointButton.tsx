"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { deleteFirePointAction } from "@/lib/db/actions";

type DeleteFirePointButtonProps = {
  pointId: string;
  zoneId: string;
};

export const DeleteFirePointButton = ({
  pointId,
  zoneId,
}: DeleteFirePointButtonProps) => {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    if (
      !window.confirm(
        "Supprimer ce point d'incendie ? Cette action est irréversible."
      )
    ) {
      return;
    }
    setIsDeleting(true);
    setError(null);
    const result = await deleteFirePointAction(pointId);
    if (result.ok) {
      router.replace(`/zone/${zoneId}`);
      return;
    }
    setError(result.error);
    setIsDeleting(false);
  };

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={isDeleting}
        className="flex min-h-[48px] items-center justify-center rounded-xl border-2 border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 transition-colors hover:border-red-300 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
        aria-label="Supprimer le point d'incendie"
        tabIndex={0}
      >
        {isDeleting ? "Suppression…" : "Supprimer le point d'incendie"}
      </button>
      {error ? (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
};
