import { and, count, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  firePointsTable,
  zoneFeatureEventsTable,
  zoneFeaturesTable,
  zonesTable,
  type FirePoint,
  type PublicZone,
  type Zone,
  type ZoneFeature,
  type ZoneFeatureEvent,
} from "@/lib/db/schema";
import {
  summarizeZonePoints,
  type ZonePointSummary,
} from "@/lib/zone-summary";

// Sélection explicite sans adminToken : seule forme autorisée en lecture publique.
const publicZoneColumns = {
  id: zonesTable.id,
  name: zonesTable.name,
  centerLat: zonesTable.centerLat,
  centerLng: zonesTable.centerLng,
  zoom: zonesTable.zoom,
  createdAt: zonesTable.createdAt,
  updatedAt: zonesTable.updatedAt,
};

export const getZones = async (): Promise<PublicZone[]> => {
  return db
    .select(publicZoneColumns)
    .from(zonesTable)
    .orderBy(desc(zonesTable.createdAt));
};

/** Compte des points par zone et par statut, pour les badges de la liste. */
export const getZoneSummaries = async (): Promise<
  Record<string, ZonePointSummary>
> => {
  const rows = await db
    .select({
      zoneId: firePointsTable.zoneId,
      statut: firePointsTable.statut,
      count: count(),
    })
    .from(firePointsTable)
    .groupBy(firePointsTable.zoneId, firePointsTable.statut);
  return summarizeZonePoints(rows);
};

export const getZonePublic = async (
  id: string
): Promise<PublicZone | null> => {
  const [zone] = await db
    .select(publicZoneColumns)
    .from(zonesTable)
    .where(eq(zonesTable.id, id))
    .limit(1);
  return zone ?? null;
};

export const getZoneForAdmin = async (
  id: string,
  token: string
): Promise<Zone | null> => {
  const [zone] = await db
    .select()
    .from(zonesTable)
    .where(and(eq(zonesTable.id, id), eq(zonesTable.adminToken, token)))
    .limit(1);
  return zone ?? null;
};

export const getFirePointsForZone = async (
  zoneId: string
): Promise<FirePoint[]> => {
  return db
    .select()
    .from(firePointsTable)
    .where(eq(firePointsTable.zoneId, zoneId))
    .orderBy(desc(firePointsTable.createdAt));
};

export const getFeaturesForZone = async (
  zoneId: string
): Promise<ZoneFeature[]> => {
  return db
    .select()
    .from(zoneFeaturesTable)
    .where(eq(zoneFeaturesTable.zoneId, zoneId))
    .orderBy(desc(zoneFeaturesTable.createdAt));
};

export const getFeatureEventsForZone = async (
  zoneId: string
): Promise<ZoneFeatureEvent[]> => {
  return db
    .select()
    .from(zoneFeatureEventsTable)
    .where(eq(zoneFeatureEventsTable.zoneId, zoneId))
    .orderBy(desc(zoneFeatureEventsTable.createdAt))
    .limit(200);
};

export const getFirePointById = async (
  id: string
): Promise<FirePoint | null> => {
  const [point] = await db
    .select()
    .from(firePointsTable)
    .where(eq(firePointsTable.id, id))
    .limit(1);
  return point ?? null;
};
