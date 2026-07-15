ALTER TABLE "app"."routine_exercises" ADD COLUMN "rest_seconds" integer DEFAULT 60 NOT NULL;--> statement-breakpoint
ALTER TABLE "app"."routine_exercises" ADD CONSTRAINT "routine_exercises_rest_seconds_check" CHECK (rest_seconds >= 0 AND rest_seconds <= 600);
