import { notFound } from "next/navigation";
import { ZoneMapView } from "@/components/map/ZoneMapView";
import { getFirePointsForZone, getZonePublic } from "@/lib/queries";

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

  const points = await getFirePointsForZone(zone.id);

  return <ZoneMapView zone={zone} points={points} />;
}
