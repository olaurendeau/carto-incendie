import type { FeatureGeometry, FeatureKind } from "@/types/fire";

/** Annotation en cours de création (métadonnées saisies avant le tracé). */
export type FeatureDraft = {
  kind: FeatureKind;
  geometryType: FeatureGeometry;
  label: string;
  color: string | null;
};
