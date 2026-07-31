"use client";

import { QUALITE_KEYS, QUALITE_LABELS, type Qualite } from "@/types/fire";

type IdentityFieldsProps = {
  name: string;
  qualite: Qualite | null;
  onNameChange: (name: string) => void;
  onQualiteChange: (qualite: Qualite | null) => void;
  /** Affiche la légende « facultatifs, mémorisés sur cet appareil »
   *  (inutile quand la section a déjà sa propre explication). */
  hint?: boolean;
};

/** Identité déclarative (pas de compte) : nom + qualité en pilules. */
export const IdentityFields = ({
  name,
  qualite,
  onNameChange,
  onQualiteChange,
  hint = false,
}: IdentityFieldsProps) => (
  <div className="flex flex-col gap-2">
    {hint ? (
      <p className="text-xs text-zinc-500">
        Votre nom et qualité — facultatifs, mémorisés sur cet appareil.
      </p>
    ) : null}
    <input
      type="text"
      value={name}
      onChange={(e) => onNameChange(e.target.value)}
      placeholder="Votre nom"
      className="min-h-[40px] rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-400"
      aria-label="Votre nom"
    />
    <div className="flex flex-wrap gap-1.5">
      {QUALITE_KEYS.map((key) => {
        const isSelected = qualite === key;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onQualiteChange(isSelected ? null : key)}
            className={`min-h-[36px] rounded-full border px-3 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-500 ${
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
);
