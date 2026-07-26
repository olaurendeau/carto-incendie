import type { Qualite } from "@/types/fire";

/** Identité locale (pas de login) : nom + qualité, persistés par navigateur. */
export type StoredIdentity = {
  name: string;
  qualite: Qualite | null;
};

const IDENTITY_KEY = "carto-incendie-identity";
const CONFIRMED_POINTS_KEY = "carto-incendie-confirmed-points";
const MY_ZONES_KEY = "carto-incendie-my-zones";

export const getStoredIdentity = (): StoredIdentity | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(IDENTITY_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredIdentity>;
    return {
      name: typeof parsed.name === "string" ? parsed.name : "",
      qualite: parsed.qualite ?? null,
    };
  } catch {
    return null;
  }
};

export const saveIdentity = (identity: StoredIdentity): void => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(IDENTITY_KEY, JSON.stringify(identity));
  } catch {
    // Ignore (mode privé, quota dépassé)
  }
};

export const getConfirmedPointIds = (): string[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(CONFIRMED_POINTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((v) => typeof v === "string") : [];
  } catch {
    return [];
  }
};

export const hasConfirmedPoint = (pointId: string): boolean =>
  getConfirmedPointIds().includes(pointId);

export const markPointConfirmed = (pointId: string): void => {
  if (typeof window === "undefined") return;
  try {
    const ids = getConfirmedPointIds();
    if (ids.includes(pointId)) return;
    window.localStorage.setItem(
      CONFIRMED_POINTS_KEY,
      JSON.stringify([...ids, pointId])
    );
  } catch {
    // Ignore
  }
};

/** Liens admin des zones créées depuis ce navigateur (secours si le lien est perdu). */
export type MyZone = {
  zoneId: string;
  adminToken: string;
};

export const getMyZones = (): MyZone[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(MY_ZONES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const rememberMyZone = (zone: MyZone): void => {
  if (typeof window === "undefined") return;
  try {
    const zones = getMyZones();
    if (zones.some((z) => z.zoneId === zone.zoneId)) return;
    window.localStorage.setItem(MY_ZONES_KEY, JSON.stringify([...zones, zone]));
  } catch {
    // Ignore
  }
};
