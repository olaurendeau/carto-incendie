import {
  doublePrecision,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import type { Criticite, FirePhotoJson, Qualite, Statut } from "@/types/fire";

export const zonesTable = pgTable("zones", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  centerLat: doublePrecision("center_lat").notNull(),
  centerLng: doublePrecision("center_lng").notNull(),
  zoom: integer("zoom").notNull().default(13),
  // Token secret remis une seule fois au créateur ; jamais exposé en lecture publique.
  adminToken: uuid("admin_token").notNull().defaultRandom(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const firePointsTable = pgTable("fire_points", {
  id: uuid("id").primaryKey().defaultRandom(),
  zoneId: uuid("zone_id")
    .notNull()
    .references(() => zonesTable.id, { onDelete: "cascade" }),
  latitude: doublePrecision("latitude").notNull(),
  longitude: doublePrecision("longitude").notNull(),
  criticite: text("criticite").$type<Criticite>().notNull(),
  statut: text("statut").$type<Statut>().notNull().default("en_cours"),
  note: text("note"),
  photos: jsonb("photos").$type<FirePhotoJson[]>().notNull().default([]),
  confirmations: integer("confirmations").notNull().default(0),
  creatorName: text("creator_name"),
  creatorQualite: text("creator_qualite").$type<Qualite>(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Zone = typeof zonesTable.$inferSelect;
export type FirePoint = typeof firePointsTable.$inferSelect;

/** Zone sans le token admin — seule forme autorisée sur les chemins publics. */
export type PublicZone = Omit<Zone, "adminToken">;
