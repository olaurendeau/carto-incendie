import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

config({ path: ".env.local" });

export default defineConfig({
  out: "./drizzle",
  schema: "./src/lib/db/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    // drizzle-kit détecte le driver par package installé, `pg` en premier
    // (devDependency) : les migrations passent en pg natif contre Neon ou le
    // PostgreSQL local. En dev local, DATABASE_URL passe par le proxy Neon
    // HTTP (port 4444) → on bascule sur le port 5432.
    url: process.env.DATABASE_URL!.replace(":4444/", ":5432/"),
  },
});
