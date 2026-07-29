-- Idempotente a mano (igual que 0001): el UPDATE de abajo no tiene WHERE por
-- fila sino por columna nula, así que re-ejecutar el archivo contra una BD ya
-- migrada no borra el historial de correcciones.
ALTER TABLE "app"."member_measurements" ADD COLUMN IF NOT EXISTS "updated_at" timestamp with time zone;--> statement-breakpoint
-- Las filas previas al ALTER nunca se editaron: igualar updated_at a created_at
-- para que `updated_at > created_at` signifique "corregida" y no "existía antes
-- de la migración".
UPDATE "app"."member_measurements" SET "updated_at" = "created_at" WHERE "updated_at" IS NULL;--> statement-breakpoint
ALTER TABLE "app"."member_measurements" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "app"."member_measurements" ALTER COLUMN "updated_at" SET NOT NULL;
