"use server";

import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import type { FirePointFormData, ZoneFormData } from "@/types/fire";
import { db } from "@/lib/db";
import { firePointsTable, zonesTable } from "@/lib/db/schema";

type ActionResult<T = { id: string }> =
  | ({ ok: true } & T)
  | { ok: false; error: string };

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const createZoneAction = async (
  data: ZoneFormData
): Promise<ActionResult<{ id: string; adminToken: string }>> => {
  if (!data.name.trim()) {
    return { ok: false, error: "Le nom de la zone est obligatoire" };
  }
  if (data.centerLat == null || data.centerLng == null) {
    return { ok: false, error: "Le centre de la zone est obligatoire" };
  }

  try {
    const [row] = await db
      .insert(zonesTable)
      .values({
        name: data.name.trim(),
        centerLat: data.centerLat,
        centerLng: data.centerLng,
        zoom: Math.round(data.zoom),
      })
      .returning({ id: zonesTable.id, adminToken: zonesTable.adminToken });

    if (!row?.id) {
      return { ok: false, error: "Échec de la création de la zone" };
    }

    revalidatePath("/");
    // Seul moment où le token admin sort du serveur.
    return { ok: true, id: row.id, adminToken: row.adminToken };
  } catch (err) {
    console.error("createZoneAction error:", err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Erreur serveur",
    };
  }
};

export const updateZoneAction = async (
  id: string,
  token: string,
  data: ZoneFormData
): Promise<ActionResult> => {
  if (!UUID_RE.test(token)) {
    return { ok: false, error: "Lien d'administration invalide" };
  }
  if (!data.name.trim()) {
    return { ok: false, error: "Le nom de la zone est obligatoire" };
  }
  if (data.centerLat == null || data.centerLng == null) {
    return { ok: false, error: "Le centre de la zone est obligatoire" };
  }

  try {
    const [row] = await db
      .update(zonesTable)
      .set({
        name: data.name.trim(),
        centerLat: data.centerLat,
        centerLng: data.centerLng,
        zoom: Math.round(data.zoom),
        updatedAt: new Date(),
      })
      .where(and(eq(zonesTable.id, id), eq(zonesTable.adminToken, token)))
      .returning({ id: zonesTable.id });

    if (!row?.id) {
      return { ok: false, error: "Lien d'administration invalide" };
    }

    revalidatePath("/");
    revalidatePath(`/zone/${id}`);
    return { ok: true, id: row.id };
  } catch (err) {
    console.error("updateZoneAction error:", err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Erreur serveur",
    };
  }
};

export const createFirePointAction = async (
  zoneId: string,
  data: FirePointFormData
): Promise<ActionResult> => {
  if (data.latitude == null || data.longitude == null) {
    return { ok: false, error: "Coordonnées obligatoires" };
  }
  if (!data.criticite) {
    return { ok: false, error: "La criticité est obligatoire" };
  }

  try {
    const [row] = await db
      .insert(firePointsTable)
      .values({
        zoneId,
        latitude: data.latitude,
        longitude: data.longitude,
        criticite: data.criticite,
        statut: data.statut,
        statutByName:
          data.statut === "en_cours" ? null : data.statutByName.trim() || null,
        statutByQualite:
          data.statut === "en_cours" ? null : data.statutByQualite,
        note: data.note.trim() || null,
        photos: data.photos,
        creatorName: data.creatorName.trim() || null,
        creatorQualite: data.creatorQualite,
      })
      .returning({ id: firePointsTable.id });

    if (!row?.id) {
      return { ok: false, error: "Échec de l'enregistrement" };
    }

    revalidatePath(`/zone/${zoneId}`);
    return { ok: true, id: row.id };
  } catch (err) {
    console.error("createFirePointAction error:", err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Erreur serveur",
    };
  }
};

export const updateFirePointAction = async (
  id: string,
  data: FirePointFormData
): Promise<ActionResult> => {
  if (data.latitude == null || data.longitude == null) {
    return { ok: false, error: "Coordonnées obligatoires" };
  }
  if (!data.criticite) {
    return { ok: false, error: "La criticité est obligatoire" };
  }

  try {
    const [row] = await db
      .update(firePointsTable)
      .set({
        latitude: data.latitude,
        longitude: data.longitude,
        criticite: data.criticite,
        statut: data.statut,
        statutByName:
          data.statut === "en_cours" ? null : data.statutByName.trim() || null,
        statutByQualite:
          data.statut === "en_cours" ? null : data.statutByQualite,
        note: data.note.trim() || null,
        photos: data.photos,
        creatorName: data.creatorName.trim() || null,
        creatorQualite: data.creatorQualite,
        updatedAt: new Date(),
      })
      .where(eq(firePointsTable.id, id))
      .returning({ id: firePointsTable.id, zoneId: firePointsTable.zoneId });

    if (!row?.id) {
      return { ok: false, error: "Point d'incendie introuvable" };
    }

    revalidatePath(`/zone/${row.zoneId}`);
    return { ok: true, id: row.id };
  } catch (err) {
    console.error("updateFirePointAction error:", err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Erreur serveur",
    };
  }
};

export const confirmFirePointAction = async (
  id: string
): Promise<ActionResult<{ confirmations: number }>> => {
  try {
    const [row] = await db
      .update(firePointsTable)
      .set({
        confirmations: sql`${firePointsTable.confirmations} + 1`,
      })
      .where(eq(firePointsTable.id, id))
      .returning({
        confirmations: firePointsTable.confirmations,
        zoneId: firePointsTable.zoneId,
      });

    if (!row) {
      return { ok: false, error: "Point d'incendie introuvable" };
    }

    revalidatePath(`/zone/${row.zoneId}`);
    return { ok: true, confirmations: row.confirmations };
  } catch (err) {
    console.error("confirmFirePointAction error:", err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Erreur serveur",
    };
  }
};
