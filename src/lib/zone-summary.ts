import { STATUT_KEYS, type Statut } from "@/types/fire";

/** Ligne d'agrégat SQL : nombre de points pour une zone et un statut. */
export type ZoneSummaryRow = {
  zoneId: string;
  statut: Statut;
  count: number;
};

/** Résumé des points d'une zone : total + décomposition par statut. */
export type ZonePointSummary = {
  total: number;
  parStatut: Record<Statut, number>;
};

/**
 * Transforme les lignes agrégées (zoneId, statut, count) en résumé par zone.
 * Les statuts absents sont présents à 0 pour un test plus prévisible.
 */
export const summarizeZonePoints = (
  rows: ZoneSummaryRow[]
): Record<string, ZonePointSummary> => {
  const summaries: Record<string, ZonePointSummary> = {};
  for (const { zoneId, statut, count } of rows) {
    const summary =
      summaries[zoneId] ??
      (summaries[zoneId] = {
        total: 0,
        parStatut: Object.fromEntries(STATUT_KEYS.map((s) => [s, 0])) as Record<
          Statut,
          number
        >,
      });
    summary.total += count;
    summary.parStatut[statut] += count;
  }
  return summaries;
};
