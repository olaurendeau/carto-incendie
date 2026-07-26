import Link from "next/link";
import { notFound } from "next/navigation";
import { FirePointForm } from "@/components/fire/FirePointForm";
import { getZonePublic } from "@/lib/queries";

export const dynamic = "force-dynamic";

type NewFirePointPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function NewFirePointPage({
  params,
  searchParams,
}: NewFirePointPageProps) {
  const { id } = await params;
  const zone = await getZonePublic(id);

  if (!zone) {
    notFound();
  }

  const query = await searchParams;
  const lat = typeof query.lat === "string" ? Number(query.lat) : null;
  const lng = typeof query.lng === "string" ? Number(query.lng) : null;
  const initialLocation =
    lat != null && !Number.isNaN(lat) && lng != null && !Number.isNaN(lng)
      ? { latitude: lat, longitude: lng }
      : null;

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col bg-zinc-50 p-4">
      <header className="mb-6">
        <Link
          href={`/zone/${zone.id}`}
          className="inline-flex min-h-[48px] min-w-[48px] items-center gap-2 text-zinc-600 hover:text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-500"
          tabIndex={0}
          aria-label="Retour à la carte de la zone"
        >
          ← Retour
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-zinc-900">
          Signaler un point d&apos;incendie
        </h1>
        <p className="text-sm text-zinc-500">Zone : {zone.name}</p>
      </header>
      <FirePointForm zoneId={zone.id} initialLocation={initialLocation} />
    </div>
  );
}
