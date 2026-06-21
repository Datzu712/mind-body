CREATE SCHEMA "app";
--> statement-breakpoint
CREATE TYPE "app"."activity_source" AS ENUM('HEALTH_CONNECT', 'MANUAL');--> statement-breakpoint
CREATE TYPE "app"."membership_status" AS ENUM('ACTIVE', 'SUSPENDED', 'EXPIRED');--> statement-breakpoint
CREATE TYPE "app"."record_status" AS ENUM('ACTIVE', 'INACTIVE', 'ARCHIVED');--> statement-breakpoint
CREATE TYPE "app"."routine_status" AS ENUM('DRAFT', 'ACTIVE', 'PAUSED', 'FINISHED', 'ARCHIVED');--> statement-breakpoint
CREATE TABLE "app"."daily_activity_summaries" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"member_id" uuid NOT NULL,
	"date" date NOT NULL,
	"steps" integer DEFAULT 0 NOT NULL,
	"calories_total" numeric(8, 2) DEFAULT '0' NOT NULL,
	"active_minutes" integer DEFAULT 0 NOT NULL,
	"exercise_count" integer DEFAULT 0 NOT NULL,
	"distance_meters" numeric(10, 2) DEFAULT '0' NOT NULL,
	"source" "app"."activity_source" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "daily_activity_summaries_member_date_key" UNIQUE("member_id","date")
);
--> statement-breakpoint
CREATE TABLE "app"."exercises" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"name" varchar(120) NOT NULL,
	"description" text,
	"muscle_group" varchar(80),
	"status" "app"."record_status" DEFAULT 'ACTIVE' NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "exercises_name_key" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "app"."member_measurements" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"member_id" uuid NOT NULL,
	"measured_at" date DEFAULT CURRENT_DATE NOT NULL,
	"weight_kg" numeric(5, 2),
	"height_cm" numeric(5, 2),
	"body_fat_percentage" numeric(5, 2),
	"waist_cm" numeric(5, 2),
	"notes" text,
	"created_by_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "app"."member_routines" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"member_id" uuid NOT NULL,
	"routine_id" uuid NOT NULL,
	"assigned_by_trainer_id" uuid,
	"assigned_at" date DEFAULT CURRENT_DATE NOT NULL,
	"ended_at" date,
	"status" "app"."record_status" DEFAULT 'ACTIVE' NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chk_member_routine_dates" CHECK ((ended_at IS NULL) OR (ended_at >= assigned_at))
);
--> statement-breakpoint
CREATE TABLE "app"."members" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"user_id" uuid NOT NULL,
	"birth_date" date,
	"emergency_contact_name" varchar(120),
	"emergency_contact_phone" varchar(30),
	"joined_at" date DEFAULT CURRENT_DATE NOT NULL,
	"notes" text,
	"status" "app"."record_status" DEFAULT 'ACTIVE' NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "members_user_id_key" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "app"."membership_plans" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"name" varchar(80) NOT NULL,
	"duration_days" integer NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"description" text,
	"status" "app"."record_status" DEFAULT 'ACTIVE' NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "membership_plans_name_key" UNIQUE("name"),
	CONSTRAINT "membership_plans_duration_days_check" CHECK (duration_days > 0),
	CONSTRAINT "membership_plans_price_check" CHECK (price >= (0)::numeric)
);
--> statement-breakpoint
CREATE TABLE "app"."memberships" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"member_id" uuid NOT NULL,
	"plan_id" uuid NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"status" "app"."membership_status" DEFAULT 'ACTIVE' NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chk_membership_dates" CHECK (end_date >= start_date)
);
--> statement-breakpoint
CREATE TABLE "app"."routine_exercises" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"routine_id" uuid NOT NULL,
	"exercise_id" uuid NOT NULL,
	"display_order" integer NOT NULL,
	"sets" integer,
	"reps" varchar(40),
	"notes" text,
	CONSTRAINT "uq_routine_exercise_order" UNIQUE("display_order","routine_id"),
	CONSTRAINT "routine_exercises_display_order_check" CHECK (display_order > 0),
	CONSTRAINT "routine_exercises_sets_check" CHECK (sets > 0)
);
--> statement-breakpoint
CREATE TABLE "app"."routines" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"trainer_id" uuid,
	"name" varchar(120) NOT NULL,
	"objective" text,
	"status" "app"."routine_status" DEFAULT 'DRAFT' NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "app"."staff" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"user_id" uuid NOT NULL,
	"hired_at" date DEFAULT CURRENT_DATE NOT NULL,
	"status" "app"."record_status" DEFAULT 'ACTIVE' NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "staff_user_id_key" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "app"."trainers" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"user_id" uuid NOT NULL,
	"specialty" varchar(120),
	"biography" text,
	"status" "app"."record_status" DEFAULT 'ACTIVE' NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "trainers_user_id_key" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "app"."users" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"keycloak_subject" uuid NOT NULL,
	"full_name" varchar(160) NOT NULL,
	"phone" varchar(30),
	"status" "app"."record_status" DEFAULT 'ACTIVE' NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_keycloak_subject_key" UNIQUE("keycloak_subject")
);
--> statement-breakpoint
ALTER TABLE "app"."daily_activity_summaries" ADD CONSTRAINT "daily_activity_summaries_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "app"."members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."member_measurements" ADD CONSTRAINT "member_measurements_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "app"."members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."member_measurements" ADD CONSTRAINT "member_measurements_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "app"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."member_routines" ADD CONSTRAINT "member_routines_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "app"."members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."member_routines" ADD CONSTRAINT "member_routines_routine_id_fkey" FOREIGN KEY ("routine_id") REFERENCES "app"."routines"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."member_routines" ADD CONSTRAINT "member_routines_assigned_by_trainer_id_fkey" FOREIGN KEY ("assigned_by_trainer_id") REFERENCES "app"."trainers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."members" ADD CONSTRAINT "members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "app"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."memberships" ADD CONSTRAINT "memberships_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "app"."members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."memberships" ADD CONSTRAINT "memberships_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "app"."membership_plans"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."routine_exercises" ADD CONSTRAINT "routine_exercises_routine_id_fkey" FOREIGN KEY ("routine_id") REFERENCES "app"."routines"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."routine_exercises" ADD CONSTRAINT "routine_exercises_exercise_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "app"."exercises"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."routines" ADD CONSTRAINT "routines_trainer_id_fkey" FOREIGN KEY ("trainer_id") REFERENCES "app"."trainers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."staff" ADD CONSTRAINT "staff_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "app"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."trainers" ADD CONSTRAINT "trainers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "app"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_daily_activity_member_date" ON "app"."daily_activity_summaries" USING btree ("member_id" uuid_ops,"date" date_ops);--> statement-breakpoint
CREATE INDEX "idx_member_measurements_member_date" ON "app"."member_measurements" USING btree ("member_id" date_ops,"measured_at" date_ops);--> statement-breakpoint
CREATE INDEX "idx_member_routines_member_status" ON "app"."member_routines" USING btree ("member_id" uuid_ops,"status" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_members_status" ON "app"."members" USING btree ("status" enum_ops);--> statement-breakpoint
CREATE INDEX "idx_memberships_member_status_dates" ON "app"."memberships" USING btree ("member_id" date_ops,"status" enum_ops,"start_date" enum_ops,"end_date" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_routines_trainer_status" ON "app"."routines" USING btree ("trainer_id" uuid_ops,"status" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_trainers_status" ON "app"."trainers" USING btree ("status" enum_ops);--> statement-breakpoint
CREATE INDEX "idx_users_keycloak_subject" ON "app"."users" USING btree ("keycloak_subject" uuid_ops);