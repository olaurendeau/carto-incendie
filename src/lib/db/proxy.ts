/**
 * Détection du proxy Neon HTTP local (PostgreSQL Docker, profil `db` de
 * compose.yaml). Source unique de « est-ce le proxy local » pour le runtime
 * (connexion HTTP claire) comme pour drizzle-kit (URL de migration en pg).
 */

const PROXY_HOSTS = ["localhost", "127.0.0.1", "neon-proxy"];
const POSTGRES_SERVICE = "postgres";

/** Vrai si l'URL pointe vers le proxy Neon HTTP local (port 4444). */
export const isLocalProxyUrl = (databaseUrl: string): boolean => {
  try {
    const url = new URL(databaseUrl);
    return PROXY_HOSTS.includes(url.hostname) && url.port === "4444";
  } catch {
    return false;
  }
};

/**
 * URL pg directe pour les migrations : le proxy est contourné.
 * Hôte remplacé par le service compose (les migrations via `make db-push`
 * s'exécutent dans un conteneur du réseau compose).
 */
export const toMigrationUrl = (databaseUrl: string): string => {
  if (!isLocalProxyUrl(databaseUrl)) return databaseUrl;
  const url = new URL(databaseUrl);
  url.hostname = POSTGRES_SERVICE;
  url.port = "5432";
  return url.toString();
};
