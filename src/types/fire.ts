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

/** Notice affichée sous le sélecteur de criticité. */
export const CRITICITE_DESCRIPTIONS: Record<Criticite, string> = {
  fumerolle:
    "Petite fumée localisée, sans flamme visible. Départ de feu possible ou reste d'un foyer : à surveiller.",
  grosse_fumee:
    "Fumée importante ou colonne de fumée visible de loin. Foyer probablement actif : signalement prioritaire.",
  flamme:
    "Flammes visibles. Incendie déclaré nécessitant une intervention rapide.",
};

/** Statut d'un point d'incendie. */
export const STATUT_KEYS = ["en_cours", "traite", "disparu"] as const;
export type Statut = (typeof STATUT_KEYS)[number];

export const STATUT_LABELS: Record<Statut, string> = {
  en_cours: "En cours",
  traite: "Traité",
  disparu: "Disparu",
};

/** Notice affichée sous le sélecteur de statut. */
export const STATUT_DESCRIPTIONS: Record<Statut, string> = {
  en_cours:
    "L'incendie est toujours actif et nécessite une surveillance. Le marqueur reste coloré selon sa criticité.",
  traite:
    "L'incendie a été éteint ou maîtrisé par une intervention. Le marqueur devient gris avec une coche verte.",
  disparu:
    "L'incendie n'est plus observable sur place (plus de fumée ni de flamme), sans intervention connue. Le marqueur devient gris.",
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
  /** Identité de la personne qui indique le statut « traité » ou « disparu ». */
  statutByName: string;
  statutByQualite: Qualite | null;
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
