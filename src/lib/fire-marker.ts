import {
  CRITICITE_COLORS,
  type Criticite,
  type Statut,
} from "@/types/fire";

/** Gris pour un point traité : l'urgence est passée, la criticité s'efface. */
const TREATED_COLOR = "#9ca3af";
const TREATED_BORDER = "#22c55e";
const DEFAULT_BORDER = "#ffffff";

export type MarkerAppearance = {
  color: string;
  borderColor: string;
  symbol: string;
};

export const getMarkerAppearance = (
  criticite: Criticite,
  statut: Statut,
  confirmations: number
): MarkerAppearance => {
  if (statut === "traite") {
    return { color: TREATED_COLOR, borderColor: TREATED_BORDER, symbol: "✓" };
  }
  return {
    color: CRITICITE_COLORS[criticite],
    borderColor: DEFAULT_BORDER,
    symbol: confirmations > 0 ? `+${confirmations}` : "",
  };
};
