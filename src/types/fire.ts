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
    "Petite fumée localisée, sans flamme visible. Peut correspondre à un départ de feu ou au reste d'un foyer.",
  grosse_fumee:
    "Fumée importante ou colonne de fumée visible de loin. Foyer probablement actif.",
  flamme: "Flammes visibles.",
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

/** Géométries possibles d'une annotation de zone. */
export const FEATURE_GEOMETRY_KEYS = ["ligne", "polygone"] as const;
export type FeatureGeometry = (typeof FEATURE_GEOMETRY_KEYS)[number];

export const FEATURE_GEOMETRY_LABELS: Record<FeatureGeometry, string> = {
  ligne: "Ligne",
  polygone: "Polygone",
};

/** Types d'annotations dessinées par l'admin sur la carte de la zone. */
export const FEATURE_KIND_KEYS = [
  "main_courante",
  "zone_risque_pierres",
  "autre",
] as const;
export type FeatureKind = (typeof FEATURE_KIND_KEYS)[number];

export const FEATURE_KIND_LABELS: Record<FeatureKind, string> = {
  main_courante: "Main courante",
  zone_risque_pierres: "Zone à risque de chute de pierres",
  autre: "Autre",
};

export const FEATURE_KIND_DESCRIPTIONS: Record<FeatureKind, string> = {
  main_courante:
    "Ligne de progression ou d'accès sécurisée (corde, sentier balisé).",
  zone_risque_pierres:
    "Périmètre exposé aux chutes de pierres : à éviter ou traverser avec prudence.",
  autre:
    "Annotation libre : choisissez la géométrie, le libellé et la couleur.",
};

/** Géométrie imposée par le type ; null = au choix de l'admin (« autre »). */
export const FEATURE_KIND_GEOMETRY: Record<FeatureKind, FeatureGeometry | null> =
  {
    main_courante: "ligne",
    zone_risque_pierres: "polygone",
    autre: null,
  };

export const FEATURE_KIND_COLORS: Record<FeatureKind, string> = {
  main_courante: "#2563eb",
  zone_risque_pierres: "#dc2626",
  autre: "#7c3aed",
};

export type LatLngPoint = { lat: number; lng: number };

/** Données du formulaire de création/édition d'une annotation. */
export type ZoneFeatureFormData = {
  kind: FeatureKind;
  geometryType: FeatureGeometry;
  coordinates: LatLngPoint[];
  label: string;
  note: string;
  /** Couleur personnalisée, utilisée uniquement pour le type « autre ». */
  color: string | null;
};

/** Identité déclarative de l'auteur d'une action sur une annotation. */
export type FeatureAuthor = {
  name: string;
  qualite: Qualite | null;
};

/** Actions journalisées dans l'historique des annotations. */
export const FEATURE_EVENT_ACTION_KEYS = [
  "creation",
  "modification",
  "suppression",
] as const;
export type FeatureEventAction = (typeof FEATURE_EVENT_ACTION_KEYS)[number];

export const FEATURE_EVENT_ACTION_LABELS: Record<FeatureEventAction, string> = {
  creation: "Création",
  modification: "Modification",
  suppression: "Suppression",
};
