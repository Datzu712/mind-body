-- Hand-written and idempotent (same as 0001/0003/0004): every statement is
-- guarded on the OLD column still being there, so re-running the file against
-- an already-migrated database is a strict no-op.
--
-- Catch-up migration. `app.routines.trainer_id` and
-- `app.member_routines.assigned_by_trainer_id` were replaced by
-- `created_by_user_id` / `assigned_by_user_id` in the live database (and in
-- sql/mab.sql and the Drizzle schema) but the change never made it into a
-- migration, so a freshly migrated database — CI, the integration suites, a new
-- laptop — still had the trainer columns and the routines module crashed on
-- every query.
--
-- The owner is a USER, not a trainer profile: routines are also created by
-- STAFF, and Forge assigns on behalf of whoever is logged in. Existing rows
-- hold trainer ids, so they are translated through app.trainers.user_id before
-- the new foreign key goes in.

-- routines.trainer_id → routines.created_by_user_id
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'app' AND table_name = 'routines' AND column_name = 'trainer_id'
    ) THEN
        ALTER TABLE "app"."routines" DROP CONSTRAINT IF EXISTS "routines_trainer_id_fkey";
        DROP INDEX IF EXISTS "app"."idx_routines_trainer_status";
        ALTER TABLE "app"."routines" RENAME COLUMN "trainer_id" TO "created_by_user_id";

        UPDATE "app"."routines" r
        SET "created_by_user_id" = t."user_id"
        FROM "app"."trainers" t
        WHERE r."created_by_user_id" = t."id";

        ALTER TABLE "app"."routines"
            ADD CONSTRAINT "routines_created_by_user_id_fkey"
            FOREIGN KEY ("created_by_user_id") REFERENCES "app"."users"("id");
        CREATE INDEX "idx_routines_created_by_status"
            ON "app"."routines" USING btree ("created_by_user_id" uuid_ops, "status" enum_ops);
    END IF;
END $$;--> statement-breakpoint

-- member_routines.assigned_by_trainer_id → member_routines.assigned_by_user_id
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'app' AND table_name = 'member_routines' AND column_name = 'assigned_by_trainer_id'
    ) THEN
        ALTER TABLE "app"."member_routines" DROP CONSTRAINT IF EXISTS "member_routines_assigned_by_trainer_id_fkey";
        ALTER TABLE "app"."member_routines" RENAME COLUMN "assigned_by_trainer_id" TO "assigned_by_user_id";

        UPDATE "app"."member_routines" mr
        SET "assigned_by_user_id" = t."user_id"
        FROM "app"."trainers" t
        WHERE mr."assigned_by_user_id" = t."id";

        ALTER TABLE "app"."member_routines"
            ADD CONSTRAINT "member_routines_assigned_by_user_id_fkey"
            FOREIGN KEY ("assigned_by_user_id") REFERENCES "app"."users"("id");
    END IF;
END $$;
