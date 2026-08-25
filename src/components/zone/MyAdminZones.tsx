"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getMyZones, type MyZone } from "@/lib/storage";
import type { PublicZone } from "@/lib/db/schema";

type MyAdminZonesProps = {
  zones: PublicZone[];
};

/**
 * Liens admin des zones créées sur ce navigateur (secours « le lien perdu »).
 * Vide si localStorage est vide : la section n'affiche rien.
 */
export const MyAdminZones = ({ zones }: MyAdminZonesProps) => {
  const [myZones, setMyZones] = useState<MyZone[]>([]);

  useEffect(() => {
    const known = getMyZones();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMyZones(known.filter((m) => zones.some((z) => z.id === m.zoneId)));
  }, [zones]);

  if (myZones.length === 0) return null;

  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
        Mes zones admin
      </h2>
      <p className="text-xs text-zinc-500">
        Créées sur ce navigateur : retrouvez ici votre lien d&apos;administration.
      </p>
      <ul className="flex flex-col gap-2">
        {myZones.map(({ zoneId, adminToken }) => {
          const zone = zones.find((z) => z.id === zoneId);
          if (!zone) return null;
          return (
            <li key={zoneId}>
              <Link
                href={`/zone/${zoneId}/edit?token=${adminToken}`}
                className="flex min-h-[48px] items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-900 transition-colors hover:bg-amber-100 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
                tabIndex={0}
                aria-label={`Modifier la zone ${zone.name}`}
              >
                <span aria-hidden>🔑</span>
                Modifier « {zone.name} »
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
};
