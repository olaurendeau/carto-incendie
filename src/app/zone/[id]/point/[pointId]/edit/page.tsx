import Link from "next/link";
import { notFound } from "next/navigation";
import { FirePointForm } from "@/components/fire/FirePointForm";
import { getFirePointById, getZonePublic } from "@/lib/queries";
import type { FirePointFormData } from "@/types/fire";

export const dynamic = "force-dynamic";

type EditFirePointPageProps = {
  params: Promise<{ id: string; pointId: string }>;
};

export default async function EditFirePointPage({
  params,
}: EditFirePointPageProps) {
  const { id, pointId } = await params;
  const [zone, point] = await Promise.all([
    getZonePublic(id),
    getFirePointById(pointId),
  ]);

  if (!zone || !point || point.zoneId !== zone.id) {
    notFound();
  }

  const initialData: FirePointFormData = {
    latitude: point.latitude,
    longitude: point.longitude,
    criticite: point.criticite,
    statut: point.statut,
    statutByName: point.statutByName ?? "",
    statutByQualite: point.statutByQualite,
    note: point.note ?? "",
    photos: point.photos,
    creatorName: point.creatorName ?? "",
    creatorQualite: point.creatorQualite,
  };

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
          Modifier le point d&apos;incendie
        </h1>
        <p className="text-sm text-zinc-500">Zone : {zone.name}</p>
      </header>
      <FirePointForm
        zoneId={zone.id}
        pointId={point.id}
        initialData={initialData}
      />
    </div>
  );
}
