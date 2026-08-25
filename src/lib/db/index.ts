import { drizzle } from "drizzle-orm/neon-http";
import { neon, neonConfig } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not defined");
}

const url = new URL(process.env.DATABASE_URL);

// Dev local : DATABASE_URL pointe vers le proxy Neon HTTP (port 4444, voir
// compose.yaml) placé devant un PostgreSQL Docker. Le driver serverless
// parle alors en HTTP clair au proxy ; en prod (Neon), rien ne change.
if (url.port === "4444") {
  neonConfig.fetchEndpoint = `http://${url.host}/sql`;
  neonConfig.useSecureWebSocket = false;
}

const sql = neon(process.env.DATABASE_URL);
export const db = drizzle({ client: sql });
