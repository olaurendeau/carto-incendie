import { notFound } from "next/navigation";
import { ZoneMapView } from "@/components/map/ZoneMapView";
import {
  getFeaturesForZone,
  getFirePointsForZone,
  getZonePublic,
} from "@/lib/queries";

export const dynamic = "force-dynamic";

type ZonePageProps = {
  params: Promise<{ id: string }>;
};

export default async function ZonePage({ params }: ZonePageProps) {
  const { id } = await params;
  const zone = await getZonePublic(id);

  if (!zone) {
    notFound();
  }

  const [points, features] = await Promise.all([
    getFirePointsForZone(zone.id),
    getFeaturesForZone(zone.id),
  ]);

  return <ZoneMapView zone={zone} points={points} features={features} />;
}
