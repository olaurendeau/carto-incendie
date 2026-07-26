export type GeoPosition = {
  latitude: number;
  longitude: number;
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
