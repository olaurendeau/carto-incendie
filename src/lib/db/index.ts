import { drizzle } from "drizzle-orm/neon-http";
import { neon, neonConfig } from "@neondatabase/serverless";
import { isLocalProxyUrl } from "@/lib/db/proxy";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not defined");
}

// Dev local sans Neon : le proxy HTTP de compose.yaml exige du HTTP clair ;
// une URL Neon (cloud) garde le comportement HTTPS par défaut.
if (isLocalProxyUrl(process.env.DATABASE_URL)) {
  const url = new URL(process.env.DATABASE_URL);
  neonConfig.fetchEndpoint = `http://${url.host}/sql`;
}

const sql = neon(process.env.DATABASE_URL);
export const db = drizzle({ client: sql });
