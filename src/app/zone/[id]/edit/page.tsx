import Link from "next/link";
import { getZoneForAdmin } from "@/lib/queries";
import { EditZoneForm } from "@/components/zone/EditZoneForm";

export const dynamic = "force-dynamic";

type EditZonePageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const InvalidTokenMessage = () => (
  <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col items-center justify-center gap-4 bg-zinc-50 p-4 text-center">
    <p className="text-4xl" aria-hidden>
      🔒
    </p>
    <h1 className="text-xl font-semibold text-zinc-900">
      Lien d&apos;administration invalide
    </h1>
    <p className="text-zinc-600">
      Ce lien ne permet pas de modifier cette zone. Vérifiez que vous utilisez
      bien le lien reçu à la création de la zone.
    </p>
    <Link
      href="/"
      className="mt-2 flex min-h-[48px] items-center justify-center rounded-xl bg-zinc-900 px-6 font-medium text-white hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2"
      tabIndex={0}
      aria-label="Retour à l'accueil"
    >
      Retour à l&apos;accueil
    </Link>
  </div>
);

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
