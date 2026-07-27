export type GeoPosition = {
  latitude: number;
  longitude: number;
};

export type GeoPositionWithAccuracy = GeoPosition & {
  /** Précision en mètres. */
  accuracy: number;
};

/**
 * Suit la position en continu (watchPosition).
 * Retourne la fonction d'arrêt du suivi ; no-op si l'API est indisponible
 * (SSR, contexte non sécurisé, navigateur sans géolocalisation).
 */
export const watchCurrentPosition = (
  onChange: (position: GeoPositionWithAccuracy) => void,
  onError?: (error: unknown) => void
): (() => void) => {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    return () => {};
  }
  const watchId = navigator.geolocation.watchPosition(
    (position) => {
      onChange({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
      });
    },
    (error) => onError?.(error),
    { enableHighAccuracy: true, maximumAge: 5000 }
  );
  return () => navigator.geolocation.clearWatch(watchId);
};

/**
 * Récupère la position actuelle via le navigateur.
 * Un tap = position enregistrée (UX prioritaire terrain).
 */
export const getCurrentPosition = (): Promise<GeoPosition> => {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new Error("Géolocalisation non disponible"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => reject(error),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  });
};
