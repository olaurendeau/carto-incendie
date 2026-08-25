import Link from "next/link";
import { getZones, getZoneSummaries } from "@/lib/queries";
import { MyAdminZones } from "@/components/zone/MyAdminZones";
import { ZoneList } from "@/components/zone/ZoneList";

export const dynamic = "force-dynamic";

const HOW_IT_WORKS_STEPS = [
  {
    title: "Créez une zone",
    description:
      "Définissez un nom, un centre et un zoom : vous recevez un lien d'administration secret à conserver.",
  },
  {
    title: "Partagez le lien public",
    description:
      "Toute personne ayant le lien peut ouvrir la carte et signaler des points d'incendie, sans compte.",
  },
  {
    title: "Signalez et confirmez",
    description:
      "Les statuts se suivent ensemble (en cours, traité, disparu) et chacun peut confirmer un point avec un « + ».",
  },
] as const;

export default async function HomePage() {
  const zones = await getZones();
  const summaries = await getZoneSummaries();

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col gap-6 bg-zinc-50 p-4">
      <header className="mt-4">
        <h1 className="text-3xl font-bold text-zinc-900">🔥 Carto Incendie</h1>
        <p className="mt-2 text-zinc-600">
          Outil cartographique simple de gestion d&apos;incendie : signalez et
          suivez les points d&apos;incendie d&apos;une zone.
        </p>
      </header>

      <section
        className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm"
        aria-labelledby="how-it-works-heading"
      >
        <h2
          id="how-it-works-heading"
          className="text-sm font-semibold uppercase tracking-wide text-zinc-500"
        >
          Comment ça marche ?
        </h2>
        <ol className="mt-3 flex flex-col gap-3">
          {HOW_IT_WORKS_STEPS.map((step, index) => (
            <li key={step.title} className="flex items-start gap-3">
              <span
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-600 text-sm font-bold text-white"
                aria-hidden
              >
                {index + 1}
              </span>
              <div>
                <p className="font-medium text-zinc-900">{step.title}</p>
                <p className="text-sm text-zinc-600">{step.description}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <Link
        href="/zone/new"
        className="flex min-h-[56px] items-center justify-center rounded-xl bg-red-600 px-4 text-lg font-semibold text-white transition-colors hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 active:bg-red-700"
        tabIndex={0}
        aria-label="Créer une nouvelle zone d'incendie"
      >
        + Créer une zone d&apos;incendie
      </Link>

      <MyAdminZones zones={zones} />

      <ZoneList zones={zones} summaries={summaries} />

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
