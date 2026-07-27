import { notFound } from "next/navigation";
import { AnnotationsEditor } from "@/components/annotations/AnnotationsEditor";
import {
  getFeaturesForZone,
  getFirePointsForZone,
  getZonePublic,
} from "@/lib/queries";

export const dynamic = "force-dynamic";

type PublicAnnotationsPageProps = {
  params: Promise<{ id: string }>;
};

/** Ajout d'annotations ouvert à tous (modification/suppression : lien admin). */
export default async function PublicAnnotationsPage({
  params,
}: PublicAnnotationsPageProps) {
  const { id } = await params;
  const zone = await getZonePublic(id);

  if (!zone) {
    notFound();
  }

  const [features, firePoints] = await Promise.all([
    getFeaturesForZone(zone.id),
    getFirePointsForZone(zone.id),
  ]);

  return (
    <AnnotationsEditor
      zone={zone}
      initialFeatures={features}
      firePoints={firePoints}
    />
  );
}
