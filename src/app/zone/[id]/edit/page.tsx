import Link from "next/link";
import { getZoneForAdmin } from "@/lib/queries";
import { EditZoneForm } from "@/components/zone/EditZoneForm";
import { InvalidTokenMessage } from "@/components/zone/InvalidTokenMessage";

export const dynamic = "force-dynamic";

type EditZonePageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function EditZonePage({
  params,
  searchParams,
}: EditZonePageProps) {
  const { id } = await params;
  const { token } = await searchParams;

  if (typeof token !== "string" || !token) {
    return <InvalidTokenMessage />;
  }

  const zone = await getZoneForAdmin(id, token).catch(() => null);

  if (!zone) {
    return <InvalidTokenMessage />;
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col bg-zinc-50 p-4">
      <header className="mb-6">
        <Link
          href={`/zone/${zone.id}`}
          className="inline-flex min-h-[48px] min-w-[48px] items-center gap-2 text-zinc-600 hover:text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-500"
          tabIndex={0}
          aria-label="Retour à la carte de la zone"
        >
          ← Retour à la carte
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-zinc-900">
          Modifier la zone
        </h1>
      </header>
      <Link
        href={`/zone/${zone.id}/edit/annotations?token=${token}`}
        className="mb-6 flex min-h-[56px] items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3 shadow-sm transition-colors hover:bg-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2"
        tabIndex={0}
        aria-label="Gérer les annotations de la carte"
      >
        <span>
          <span className="block font-medium text-zinc-900">
            🗺️ Gérer les annotations
          </span>
          <span className="block text-sm text-zinc-500">
            Tracer les mains courantes et zones à risque visibles par tous les
            visiteurs.
          </span>
        </span>
        <span className="text-zinc-400" aria-hidden>
          →
        </span>
      </Link>
      <EditZoneForm
        zoneId={zone.id}
        token={token}
        initialData={{
          name: zone.name,
          centerLat: zone.centerLat,
          centerLng: zone.centerLng,
          zoom: zone.zoom,
        }}
      />
    </div>
  );
}
