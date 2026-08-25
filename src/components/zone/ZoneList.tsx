"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { STATUT_KEYS, STATUT_LABELS, type Statut } from "@/types/fire";
import type { ZonePointSummary } from "@/lib/zone-summary";
import type { PublicZone } from "@/lib/db/schema";

type ZoneListProps = {
  zones: PublicZone[];
  summaries: Record<string, ZonePointSummary>;
};

const BADGE_CLASSES: Record<Statut, string> = {
  en_cours: "bg-red-100 text-red-800",
  traite: "bg-emerald-100 text-emerald-800",
  disparu: "bg-zinc-100 text-zinc-500",
};

const normalize = (value: string): string =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

/** Liste des zones avec filtre par nom côté client et badges par statut. */
export const ZoneList = ({ zones, summaries }: ZoneListProps) => {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = normalize(query.trim());
    if (!q) return zones;
    return zones.filter((z) => normalize(z.name).includes(q));
  }, [zones, query]);

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold text-zinc-900">
        Zones d&apos;incendie
      </h2>

      {zones.length > 0 && (
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher une zone…"
          className="min-h-[48px] w-full rounded-xl border border-zinc-300 bg-white px-4 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-500"
          aria-label="Rechercher une zone par son nom"
        />
      )}

      {filtered.length === 0 ? (
        <p className="rounded-xl border border-dashed border-zinc-300 bg-white p-6 text-center text-zinc-500">
          {zones.length === 0
            ? "Aucune zone pour l’instant. Créez la première !"
            : "Aucune zone ne correspond à votre recherche."}
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {filtered.map((zone) => {
            const summary = summaries[zone.id];
            return (
              <li key={zone.id}>
                <Link
                  href={`/zone/${zone.id}`}
                  className="flex min-h-[56px] items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3 shadow-sm transition-colors hover:bg-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2"
                  tabIndex={0}
                  aria-label={`Ouvrir la zone ${zone.name}`}
                >
                  <div className="flex min-w-0 flex-col gap-1">
                    <span className="truncate font-medium text-zinc-900">
                      {zone.name}
                    </span>
                    {summary?.total ? (
                      <span className="flex flex-wrap items-center gap-1.5 text-xs">
                        <span className="font-medium text-zinc-500">
                          {summary.total} point{summary.total > 1 ? "s" : ""} :
                        </span>
                        {STATUT_KEYS.filter((s) => summary.parStatut[s] > 0).map(
                          (s) => (
                            <span
                              key={s}
                              className={`rounded-full px-2 py-0.5 font-medium ${BADGE_CLASSES[s]}`}
                            >
                              {summary.parStatut[s]} {STATUT_LABELS[s]}
                            </span>
                          )
                        )}
                      </span>
                    ) : (
                      <span className="text-xs text-zinc-400">
                        Aucun point signalé
                      </span>
                    )}
                  </div>
                  <span className="self-start text-sm text-zinc-400">
                    {new Date(zone.createdAt).toLocaleDateString("fr-FR")}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
};
