CREATE TYPE "app"."dni_type" AS ENUM('CEDULA_NACIONAL', 'DIMEX', 'PASAPORTE');--> statement-breakpoint
CREATE TYPE "app"."notification_type" AS ENUM('ROUTINE_ASSIGNED', 'ROUTINE_UPDATED', 'SESSION_VALIDATED');--> statement-breakpoint
CREATE TYPE "app"."training_session_status" AS ENUM('PENDING', 'CONFIRMED', 'VALIDATED', 'EXPIRED');--> statement-breakpoint
CREATE TABLE "app"."exercise_logs" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"session_id" uuid NOT NULL,
	"routine_exercise_id" uuid NOT NULL,
	"target_sets" integer,
	"target_reps" varchar(40),
	"target_weight_kg" numeric(5, 2),
	"completed_sets" integer,
	"completed_reps_log" text,
	"weight_kg_actual" numeric(5, 2),
	"notes" text,
	"completed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_exercise_logs_session_routine_exercise" UNIQUE("session_id","routine_exercise_id")
);
--> statement-breakpoint
CREATE TABLE "app"."notifications" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" "app"."notification_type" NOT NULL,
	"title" varchar(200) NOT NULL,
	"body" text,
	"payload" jsonb,
	"read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "app"."routine_versions" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"routine_id" uuid NOT NULL,
	"version_number" integer NOT NULL,
	"snapshot" jsonb NOT NULL,
	"changed_by" uuid,
	"change_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_routine_versions_routine_version" UNIQUE("routine_id","version_number")
);
--> statement-breakpoint
CREATE TABLE "app"."training_sessions" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"member_routine_id" uuid NOT NULL,
	"date" date DEFAULT CURRENT_DATE NOT NULL,
	"status" "app"."training_session_status" DEFAULT 'PENDING' NOT NULL,
	"confirmed_at" timestamp with time zone,
	"confirmed_by" uuid,
	"validated_by_trainer_id" uuid,
	"validated_at" timestamp with time zone,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "app"."member_measurements" DROP CONSTRAINT "member_measurements_created_by_user_id_fkey";
--> statement-breakpoint
ALTER TABLE "app"."users" ADD COLUMN "email" varchar(255);--> statement-breakpoint
ALTER TABLE "app"."users" ADD COLUMN "dni" varchar(20);--> statement-breakpoint
ALTER TABLE "app"."users" ADD COLUMN "dni_type" "app"."dni_type";--> statement-breakpoint
ALTER TABLE "app"."users" ADD COLUMN "birth_date" date;--> statement-breakpoint
ALTER TABLE "app"."exercise_logs" ADD CONSTRAINT "exercise_logs_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "app"."training_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."exercise_logs" ADD CONSTRAINT "exercise_logs_routine_exercise_id_fkey" FOREIGN KEY ("routine_exercise_id") REFERENCES "app"."routine_exercises"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "app"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."routine_versions" ADD CONSTRAINT "routine_versions_routine_id_fkey" FOREIGN KEY ("routine_id") REFERENCES "app"."routines"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."routine_versions" ADD CONSTRAINT "routine_versions_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "app"."trainers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."training_sessions" ADD CONSTRAINT "training_sessions_member_routine_id_fkey" FOREIGN KEY ("member_routine_id") REFERENCES "app"."member_routines"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."training_sessions" ADD CONSTRAINT "training_sessions_confirmed_by_fkey" FOREIGN KEY ("confirmed_by") REFERENCES "app"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."training_sessions" ADD CONSTRAINT "training_sessions_validated_by_trainer_id_fkey" FOREIGN KEY ("validated_by_trainer_id") REFERENCES "app"."trainers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_exercise_logs_session_id" ON "app"."exercise_logs" USING btree ("session_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_notifications_user_read" ON "app"."notifications" USING btree ("user_id" uuid_ops,"read");--> statement-breakpoint
CREATE INDEX "idx_routine_versions_routine_id" ON "app"."routine_versions" USING btree ("routine_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_training_sessions_member_routine_status" ON "app"."training_sessions" USING btree ("member_routine_id" uuid_ops,"status");--> statement-breakpoint
ALTER TABLE "app"."member_measurements" DROP COLUMN "created_by_user_id";--> statement-breakpoint
ALTER TABLE "app"."members" DROP COLUMN "birth_date";--> statement-breakpoint
ALTER TABLE "app"."users" ADD CONSTRAINT "users_dni_key" UNIQUE("dni");