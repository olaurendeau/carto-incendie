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

      <footer className="mt-auto flex justify-center pt-8 pb-2">
        <a
          href="https://github.com/olaurendeau/carto-incendie"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-[48px] items-center gap-2 rounded-xl px-4 text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2"
          tabIndex={0}
          aria-label="Voir le code source sur GitHub"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden
          >
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
          </svg>
          Code source sur GitHub
        </a>
      </footer>
    </div>
  );
}
