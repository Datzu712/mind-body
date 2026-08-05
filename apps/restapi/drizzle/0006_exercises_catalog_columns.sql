-- Hand-written and idempotent (same as 0001/0003/0004/0005): every statement
-- carries IF NOT EXISTS, so re-running the file against an already-migrated
-- database is a strict no-op.
--
-- Catch-up migration, purely additive. The exercise catalog columns
-- (source_id, body_part, equipment, target, secondary_muscles,
-- instructions_es/en, image_url, gif_url) exist in the live database and in
-- sql/mab.sql, but were only ever applied by hand — the Drizzle schema reads
-- them and no migration ever created them.
--
-- The routines module is what makes this load-bearing: `RoutinesService.detail`
-- joins `app.exercises` and selects every column, so on a freshly migrated
-- database (CI, the integration suites, a new laptop) reading ANY routine
-- failed with `column exercises.source_id does not exist`.
ALTER TABLE "app"."exercises" ADD COLUMN IF NOT EXISTS "source_id" varchar(20);--> statement-breakpoint
ALTER TABLE "app"."exercises" ADD COLUMN IF NOT EXISTS "body_part" varchar(80);--> statement-breakpoint
ALTER TABLE "app"."exercises" ADD COLUMN IF NOT EXISTS "equipment" varchar(80);--> statement-breakpoint
ALTER TABLE "app"."exercises" ADD COLUMN IF NOT EXISTS "target" varchar(80);--> statement-breakpoint
ALTER TABLE "app"."exercises" ADD COLUMN IF NOT EXISTS "secondary_muscles" text[];--> statement-breakpoint
ALTER TABLE "app"."exercises" ADD COLUMN IF NOT EXISTS "instructions_es" text[];--> statement-breakpoint
ALTER TABLE "app"."exercises" ADD COLUMN IF NOT EXISTS "instructions_en" text[];--> statement-breakpoint
ALTER TABLE "app"."exercises" ADD COLUMN IF NOT EXISTS "image_url" text;--> statement-breakpoint
ALTER TABLE "app"."exercises" ADD COLUMN IF NOT EXISTS "gif_url" text;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uq_exercises_source_id" ON "app"."exercises" USING btree ("source_id" text_ops);
