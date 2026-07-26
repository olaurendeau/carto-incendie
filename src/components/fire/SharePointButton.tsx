"use client";

import { Share2 } from "lucide-react";
import { useCallback, useRef, useState } from "react";

type SharePointButtonProps = {
  latitude: number;
  longitude: number;
  /** Style compact pour la popup de la carte. */
  compact?: boolean;
};

/** ~1 m de précision, suffisant pour retrouver un départ de feu. */
const formatCoords = (lat: number, lng: number): string =>
  `${lat.toFixed(5)}, ${lng.toFixed(5)}`;

export const SharePointButton = ({
  latitude,
  longitude,
  compact = false,
}: SharePointButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const coords = formatCoords(latitude, longitude);
  // geo: ouvre le sélecteur d'app de cartographie du téléphone
  // (Google Maps, iPhigénie, OsmAnd… selon les apps installées).
  const geoUrl = `geo:${latitude},${longitude}`;
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;

  const handleToggle = useCallback(() => setIsOpen((prev) => !prev), []);

  const handleShare = useCallback(async () => {
    const text = `Point d'incendie — ${coords}`;
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title: text, text, url: googleMapsUrl });
      } catch {
        // Partage annulé par l'utilisateur.
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(`${text}\n${googleMapsUrl}`);
      setIsCopied(true);
      if (copyTimeoutRef.current != null) clearTimeout(copyTimeoutRef.current);
      copyTimeoutRef.current = setTimeout(() => setIsCopied(false), 2000);
    } catch {
      // Presse-papier indisponible.
    }
  }, [coords, googleMapsUrl]);

  // !text-zinc-700 : prime sur la couleur de lien imposée par .leaflet-container a.
  const optionClass = compact
    ? "flex min-h-[32px] items-center rounded-lg border border-zinc-300 bg-white px-3 text-xs font-medium !text-zinc-700 hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2"
    : "flex min-h-[48px] items-center rounded-xl border border-zinc-300 bg-white px-4 text-sm font-medium !text-zinc-700 hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2";

  return (
    <div className="flex flex-col gap-1.5">
      <button
        type="button"
        onClick={handleToggle}
        className={`${optionClass} justify-center gap-2`}
        aria-expanded={isOpen}
        aria-label={`Partager la position (${coords})`}
        tabIndex={0}
      >
        <Share2 size={compact ? 14 : 18} aria-hidden />
        Partager la position
      </button>
      {isOpen ? (
        <div
          className="flex flex-col gap-1.5"
          role="group"
          aria-label="Options de partage de la position"
        >
          <a href={geoUrl} className={optionClass} tabIndex={0}>
            Ouvrir dans une app de carto
          </a>
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={optionClass}
            tabIndex={0}
          >
            Ouvrir dans Google Maps
          </a>
          <button
            type="button"
            onClick={handleShare}
            className={optionClass}
            tabIndex={0}
          >
            {isCopied ? "Copié !" : "Partager / copier les coordonnées"}
          </button>
        </div>
      ) : null}
    </div>
  );
};
