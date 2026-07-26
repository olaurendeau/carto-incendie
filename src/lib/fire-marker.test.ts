import { describe, expect, it } from "vitest";
import { getMarkerAppearance } from "@/lib/fire-marker";
import { CRITICITE_COLORS } from "@/types/fire";

describe("getMarkerAppearance", () => {
  it("colore le marqueur selon la criticité quand l'incendie est en cours", () => {
    expect(getMarkerAppearance("fumerolle", "en_cours", 0).color).toBe(
      CRITICITE_COLORS.fumerolle
    );
    expect(getMarkerAppearance("grosse_fumee", "en_cours", 0).color).toBe(
      CRITICITE_COLORS.grosse_fumee
    );
    expect(getMarkerAppearance("flamme", "en_cours", 0).color).toBe(
      CRITICITE_COLORS.flamme
    );
  });

  it("affiche le compteur de confirmations quand il y en a", () => {
    expect(getMarkerAppearance("flamme", "en_cours", 0).symbol).toBe("");
    expect(getMarkerAppearance("flamme", "en_cours", 3).symbol).toBe("+3");
  });

  it("grise le marqueur avec une coche quand le point est traité", () => {
    const appearance = getMarkerAppearance("flamme", "traite", 5);
    expect(appearance.color).toBe("#9ca3af");
    expect(appearance.borderColor).toBe("#22c55e");
    expect(appearance.symbol).toBe("✓");
  });

  it("grise le marqueur avec un tiret quand le point est disparu", () => {
    const appearance = getMarkerAppearance("fumerolle", "disparu", 2);
    expect(appearance.color).toBe("#9ca3af");
    expect(appearance.borderColor).toBe("#e4e4e7");
    expect(appearance.symbol).toBe("—");
  });
});
