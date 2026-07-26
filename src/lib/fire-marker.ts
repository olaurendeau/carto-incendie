import {
  CRITICITE_COLORS,
  type Criticite,
  type Statut,
} from "@/types/fire";

/** Gris pour un point traité ou disparu : l'urgence est passée, la criticité s'efface. */
const INACTIVE_COLOR = "#9ca3af";
const TREATED_BORDER = "#22c55e";
const VANISHED_BORDER = "#e4e4e7";
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
    return { color: INACTIVE_COLOR, borderColor: TREATED_BORDER, symbol: "✓" };
  }
  if (statut === "disparu") {
    return { color: INACTIVE_COLOR, borderColor: VANISHED_BORDER, symbol: "—" };
  }
  return {
    color: CRITICITE_COLORS[criticite],
    borderColor: DEFAULT_BORDER,
    symbol: confirmations > 0 ? `+${confirmations}` : "",
  };
};
