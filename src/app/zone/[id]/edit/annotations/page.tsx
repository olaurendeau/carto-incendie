import { AnnotationsEditor } from "@/components/annotations/AnnotationsEditor";
import { InvalidTokenMessage } from "@/components/zone/InvalidTokenMessage";
import {
  getFeaturesForZone,
  getFirePointsForZone,
  getZoneForAdmin,
} from "@/lib/queries";

export const dynamic = "force-dynamic";

type AnnotationsPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AnnotationsPage({
  params,
  searchParams,
}: AnnotationsPageProps) {
  const { id } = await params;
  const { token } = await searchParams;

  if (typeof token !== "string" || !token) {
    return <InvalidTokenMessage />;
  }

  const zone = await getZoneForAdmin(id, token).catch(() => null);

  if (!zone) {
    return <InvalidTokenMessage />;
  }

  const [features, firePoints] = await Promise.all([
    getFeaturesForZone(zone.id),
    getFirePointsForZone(zone.id),
  ]);

  // Convention : ne jamais sérialiser adminToken vers le client.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { adminToken, ...publicZone } = zone;

  return (
    <AnnotationsEditor
      zone={publicZone}
      token={token}
      initialFeatures={features}
      firePoints={firePoints}
    />
  );
}
