import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";
import { toMigrationUrl } from "./src/lib/db/proxy";

config({ path: ".env.local" });

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not defined");
}

export default defineConfig({
  out: "./drizzle",
  schema: "./src/lib/db/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    // Le package `pg` (devDependency) est installé : drizzle-kit l'utilise pour
    // les migrations, en TCP — valable pour Neon comme pour le PostgreSQL local.
    // En dev local, DATABASE_URL pointe vers le proxy Neon HTTP : on la
    // contourne vers le service compose `postgres:5432` (toMigrationUrl).
    url: toMigrationUrl(process.env.DATABASE_URL),
  },
});
