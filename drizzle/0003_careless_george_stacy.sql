CREATE TABLE "zone_feature_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"zone_id" uuid NOT NULL,
	"feature_id" uuid,
	"action" text NOT NULL,
	"feature_kind" text NOT NULL,
	"feature_label" text,
	"author_name" text,
	"author_qualite" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "zone_features" ADD COLUMN "note" text;--> statement-breakpoint
ALTER TABLE "zone_features" ADD COLUMN "creator_name" text;--> statement-breakpoint
ALTER TABLE "zone_features" ADD COLUMN "creator_qualite" text;--> statement-breakpoint
ALTER TABLE "zone_feature_events" ADD CONSTRAINT "zone_feature_events_zone_id_zones_id_fk" FOREIGN KEY ("zone_id") REFERENCES "public"."zones"("id") ON DELETE cascade ON UPDATE no action;