-- Reconciliación del baseline (Task 0 del plan de reservas).
-- Alinea una BD creada desde 0000 con schema.ts. Es idempotente a propósito:
-- la BD de desarrollo ya recibió estos cambios a mano (ALTER TABLE ... IF NOT
-- EXISTS), así que cada paso tolera que el estado destino ya exista.
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace
        WHERE n.nspname = 'app' AND t.typname = 'dni_type'
    ) THEN
        CREATE TYPE "app"."dni_type" AS ENUM('CEDULA_NACIONAL', 'DIMEX', 'PASAPORTE');
    END IF;
END $$;--> statement-breakpoint
ALTER TABLE "app"."member_measurements" DROP CONSTRAINT IF EXISTS "member_measurements_created_by_user_id_fkey";--> statement-breakpoint
ALTER TABLE "app"."users" ADD COLUMN IF NOT EXISTS "email" varchar(255);--> statement-breakpoint
ALTER TABLE "app"."users" ADD COLUMN IF NOT EXISTS "dni" varchar(20);--> statement-breakpoint
ALTER TABLE "app"."users" ADD COLUMN IF NOT EXISTS "dni_type" "app"."dni_type";--> statement-breakpoint
ALTER TABLE "app"."users" ADD COLUMN IF NOT EXISTS "birth_date" date;--> statement-breakpoint
-- birth_date vivía en members: se preserva en users antes de eliminar la columna.
DO $$ BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'app' AND table_name = 'members' AND column_name = 'birth_date'
    ) THEN
        UPDATE "app"."users" u
        SET "birth_date" = m."birth_date"
        FROM "app"."members" m
        WHERE m."user_id" = u."id" AND u."birth_date" IS NULL AND m."birth_date" IS NOT NULL;
    END IF;
END $$;--> statement-breakpoint
ALTER TABLE "app"."member_measurements" DROP COLUMN IF EXISTS "created_by_user_id";--> statement-breakpoint
ALTER TABLE "app"."members" DROP COLUMN IF EXISTS "birth_date";--> statement-breakpoint
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_dni_key') THEN
        ALTER TABLE "app"."users" ADD CONSTRAINT "users_dni_key" UNIQUE("dni");
    END IF;
END $$;
