import Link from "next/link";
import { getZones } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const zones = await getZones();

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col gap-6 bg-zinc-50 p-4">
      <header className="mt-4">
        <h1 className="text-3xl font-bold text-zinc-900">🔥 Carto Incendie</h1>
        <p className="mt-2 text-zinc-600">
          Outil cartographique simple de gestion d&apos;incendie : signalez et
          suivez les points d&apos;incendie d&apos;une zone.
        </p>
      </header>

      <Link
        href="/zone/new"
        className="flex min-h-[56px] items-center justify-center rounded-xl bg-red-600 px-4 text-lg font-semibold text-white transition-colors hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 active:bg-red-700"
        tabIndex={0}
        aria-label="Créer une nouvelle zone d'incendie"
      >
        + Créer une zone d&apos;incendie
      </Link>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold text-zinc-900">
          Zones d&apos;incendie
        </h2>
        {zones.length === 0 ? (
          <p className="rounded-xl border border-dashed border-zinc-300 bg-white p-6 text-center text-zinc-500">
            Aucune zone pour l&apos;instant. Créez la première !
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {zones.map((zone) => (
              <li key={zone.id}>
                <Link
                  href={`/zone/${zone.id}`}
                  className="flex min-h-[56px] items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3 shadow-sm transition-colors hover:bg-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2"
                  tabIndex={0}
                  aria-label={`Ouvrir la zone ${zone.name}`}
                >
                  <span className="font-medium text-zinc-900">{zone.name}</span>
                  <span className="text-sm text-zinc-400">
                    {new Date(zone.createdAt).toLocaleDateString("fr-FR")}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
