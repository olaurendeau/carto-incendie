"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { rememberMyZone } from "@/lib/storage";

type AdminLinkRevealProps = {
  zoneId: string;
  adminToken: string;
};

/**
 * Affiché une seule fois après la création d'une zone :
 * le lien admin ne sera plus jamais montré ensuite.
 */
export const AdminLinkReveal = ({ zoneId, adminToken }: AdminLinkRevealProps) => {
  // Composant affiché uniquement après une création côté client : window est disponible.
  const [adminUrl] = useState(() =>
    typeof window === "undefined"
      ? ""
      : `${window.location.origin}/zone/${zoneId}/edit?token=${adminToken}`
  );
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    // Secours : mémoriser le lien admin dans ce navigateur.
    rememberMyZone({ zoneId, adminToken });
  }, [zoneId, adminToken]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(adminUrl);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    } catch {
      // Ignore : l'utilisateur peut copier manuellement.
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
        <h2 className="text-lg font-semibold text-emerald-900">
          Zone créée ✓
        </h2>
        <p className="mt-1 text-sm text-emerald-800">
          Voici votre lien d&apos;administration. Il permet de modifier la zone
          (nom, centre, zoom).
        </p>
      </div>

      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
        <p className="text-sm font-semibold text-amber-900">
          ⚠️ Conservez ce lien précieusement : il ne sera plus jamais affiché.
        </p>
        <p className="mt-3 break-all rounded-lg bg-white px-3 py-2 font-mono text-xs text-zinc-700">
          {adminUrl || "…"}
        </p>
        <button
          type="button"
          onClick={handleCopy}
          className="mt-3 flex min-h-[48px] w-full items-center justify-center rounded-xl bg-zinc-900 px-4 font-medium text-white transition-colors hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 active:bg-zinc-800"
          tabIndex={0}
          aria-label="Copier le lien d'administration"
        >
          {isCopied ? "Copié ✓" : "Copier le lien"}
        </button>
      </div>

      <Link
        href={`/zone/${zoneId}`}
        className="flex min-h-[52px] items-center justify-center rounded-xl bg-red-600 px-4 font-semibold text-white transition-colors hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 active:bg-red-700"
        tabIndex={0}
        aria-label="Ouvrir la carte de la zone"
      >
        Ouvrir la carte de la zone
      </Link>
    </div>
  );
};
