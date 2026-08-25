import { describe, expect, it } from "vitest";
import { summarizeZonePoints } from "@/lib/zone-summary";

describe("summarizeZonePoints", () => {
  it("retourne un objet vide quand il n'y a aucune ligne", () => {
    expect(summarizeZonePoints([])).toEqual({});
  });

  it("cumule le total et la décomposition par statut d'une même zone", () => {
    const summaries = summarizeZonePoints([
      { zoneId: "z1", statut: "en_cours", count: 3 },
      { zoneId: "z1", statut: "traite", count: 1 },
      { zoneId: "z1", statut: "disparu", count: 2 },
    ]);
    expect(summaries["z1"]).toEqual({
      total: 6,
      parStatut: { en_cours: 3, traite: 1, disparu: 2 },
    });
  });

  it("initialise les statuts absents à 0 pour un affichage stable", () => {
    const summaries = summarizeZonePoints([
      { zoneId: "z1", statut: "traite", count: 2 },
    ]);
    expect(summaries["z1"].parStatut).toEqual({
      en_cours: 0,
      traite: 2,
      disparu: 0,
    });
  });

  it("regroupe par zone indépendamment", () => {
    const summaries = summarizeZonePoints([
      { zoneId: "z1", statut: "en_cours", count: 1 },
      { zoneId: "z2", statut: "traite", count: 2 },
    ]);
    expect(Object.keys(summaries)).toHaveLength(2);
    expect(summaries["z1"].total).toBe(1);
    expect(summaries["z2"].total).toBe(2);
  });
});
