/** Criticité d'un point d'incendie. */
export const CRITICITE_KEYS = ["fumerolle", "grosse_fumee", "flamme"] as const;
export type Criticite = (typeof CRITICITE_KEYS)[number];

export const CRITICITE_LABELS: Record<Criticite, string> = {
  fumerolle: "Fumerolle",
  grosse_fumee: "Grosse fumée",
  flamme: "Flamme",
};

/** Couleur du marqueur selon la criticité. */
export const CRITICITE_COLORS: Record<Criticite, string> = {
  fumerolle: "#eab308",
  grosse_fumee: "#f97316",
  flamme: "#dc2626",
};

/** Statut d'un point d'incendie. */
export const STATUT_KEYS = ["en_cours", "traite"] as const;
export type Statut = (typeof STATUT_KEYS)[number];

export const STATUT_LABELS: Record<Statut, string> = {
  en_cours: "En cours",
  traite: "Traité",
};

/** Qualité du créateur d'un point d'incendie (pas de login formel). */
export const QUALITE_KEYS = ["pompier", "elu", "habitant", "autre"] as const;
export type Qualite = (typeof QUALITE_KEYS)[number];

export const QUALITE_LABELS: Record<Qualite, string> = {
  pompier: "Pompier",
  elu: "Élu",
  habitant: "Habitant",
  autre: "Autre",
};

/** Photo d'un point d'incendie (Cloudinary). */
export type FirePhotoJson = {
  url: string;
  publicId: string;
};

/** Données du formulaire de création/édition d'un point d'incendie. */
export type FirePointFormData = {
  latitude: number | null;
  longitude: number | null;
  criticite: Criticite | null;
  statut: Statut;
  note: string;
  photos: FirePhotoJson[];
  creatorName: string;
  creatorQualite: Qualite | null;
};

/** Données du formulaire de création/édition d'une zone. */
export type ZoneFormData = {
  name: string;
  centerLat: number | null;
  centerLng: number | null;
  zoom: number;
};
