CREATE TYPE "app"."class_level" AS ENUM('LOW', 'MEDIUM', 'HIGH');--> statement-breakpoint
CREATE TYPE "app"."class_session_cancel_reason" AS ENUM('MANUAL', 'SERIES_INACTIVE', 'SERIES_ARCHIVED', 'SCHEDULE_REMOVED');--> statement-breakpoint
CREATE TYPE "app"."class_session_status" AS ENUM('SCHEDULED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "app"."reservation_reason" AS ENUM('MEMBER_BOOKED', 'MEMBER_JOINED_WAITLIST', 'WAITLIST_PROMOTED', 'MEMBER_CANCELLED', 'ADMIN_CANCELLED', 'LATE_CANCELLATION', 'SESSION_CANCELLED', 'SERIES_CHANGED', 'WAITLIST_REMOVED', 'WAITLIST_EXPIRED', 'RESCHEDULED', 'ATTENDANCE');--> statement-breakpoint
CREATE TYPE "app"."reservation_status" AS ENUM('CONFIRMED', 'WAITLISTED', 'ATTENDED', 'NO_SHOW', 'CANCELLED');--> statement-breakpoint
CREATE TABLE "app"."class_schedule_events" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"class_series_id" uuid,
	"class_session_id" uuid,
	"event_type" varchar(80) NOT NULL,
	"actor_user_id" uuid,
	"before_state" jsonb,
	"after_state" jsonb,
	"reason" text,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chk_class_schedule_events_target" CHECK (num_nonnulls(class_series_id, class_session_id) = 1)
);
--> statement-breakpoint
CREATE TABLE "app"."class_series" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"trainer_id" uuid NOT NULL,
	"name" varchar(120) NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"local_start_time" time NOT NULL,
	"duration_minutes" smallint NOT NULL,
	"capacity" integer NOT NULL,
	"allow_waitlist" boolean DEFAULT false NOT NULL,
	"starts_on" date NOT NULL,
	"category" varchar(80),
	"level" "app"."class_level",
	"room" varchar(120),
	"zone" varchar(120),
	"status" "app"."record_status" DEFAULT 'ACTIVE' NOT NULL,
	"created_by_user_id" uuid NOT NULL,
	"updated_by_user_id" uuid NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "class_series_duration_minutes_check" CHECK (duration_minutes BETWEEN 1 AND 1440),
	CONSTRAINT "class_series_capacity_check" CHECK (capacity BETWEEN 1 AND 500),
	CONSTRAINT "class_series_version_check" CHECK (version > 0),
	CONSTRAINT "chk_class_series_archived_deleted_at" CHECK ((status = 'ARCHIVED') = (deleted_at IS NOT NULL))
);
--> statement-breakpoint
CREATE TABLE "app"."class_series_weekdays" (
	"class_series_id" uuid NOT NULL,
	"iso_weekday" smallint NOT NULL,
	CONSTRAINT "class_series_weekdays_pkey" PRIMARY KEY("class_series_id","iso_weekday"),
	CONSTRAINT "class_series_weekdays_iso_weekday_check" CHECK (iso_weekday BETWEEN 1 AND 7)
);
--> statement-breakpoint
CREATE TABLE "app"."class_sessions" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"class_series_id" uuid NOT NULL,
	"origin_date" date NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"class_name" varchar(120) NOT NULL,
	"description" text NOT NULL,
	"trainer_id" uuid NOT NULL,
	"capacity" integer NOT NULL,
	"allow_waitlist" boolean NOT NULL,
	"category" varchar(80),
	"level" "app"."class_level",
	"room" varchar(120),
	"zone" varchar(120),
	"status" "app"."class_session_status" DEFAULT 'SCHEDULED' NOT NULL,
	"schedule_overridden" boolean DEFAULT false NOT NULL,
	"source_series_version" integer NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"cancel_reason" "app"."class_session_cancel_reason",
	"cancelled_at" timestamp with time zone,
	"cancelled_by_user_id" uuid,
	"updated_by_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "class_sessions_series_origin_key" UNIQUE("class_series_id","origin_date"),
	CONSTRAINT "class_sessions_time_range_check" CHECK (ends_at > starts_at),
	CONSTRAINT "class_sessions_capacity_check" CHECK (capacity BETWEEN 1 AND 500),
	CONSTRAINT "class_sessions_version_check" CHECK (version > 0),
	CONSTRAINT "chk_class_sessions_cancel_coherence" CHECK ((status = 'SCHEDULED' AND cancel_reason IS NULL AND cancelled_at IS NULL) OR (status = 'CANCELLED' AND cancel_reason IS NOT NULL AND cancelled_at IS NOT NULL))
);
--> statement-breakpoint
CREATE TABLE "app"."reservation_events" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"reservation_id" uuid NOT NULL,
	"actor_user_id" uuid,
	"from_status" "app"."reservation_status",
	"to_status" "app"."reservation_status" NOT NULL,
	"reason" "app"."reservation_reason" NOT NULL,
	"from_session_id" uuid,
	"to_session_id" uuid,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "app"."reservations" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"session_id" uuid NOT NULL,
	"member_id" uuid NOT NULL,
	"status" "app"."reservation_status" NOT NULL,
	"status_reason" "app"."reservation_reason" NOT NULL,
	"waitlisted_at" timestamp with time zone,
	"confirmed_at" timestamp with time zone,
	"cancelled_at" timestamp with time zone,
	"attendance_marked_at" timestamp with time zone,
	"rescheduled_from_reservation_id" uuid,
	"created_by_user_id" uuid NOT NULL,
	"updated_by_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chk_reservations_not_self_reschedule" CHECK (rescheduled_from_reservation_id IS NULL OR rescheduled_from_reservation_id <> id),
	CONSTRAINT "chk_reservations_status_timestamps" CHECK ((status = 'WAITLISTED' AND waitlisted_at IS NOT NULL AND cancelled_at IS NULL) OR (status = 'CONFIRMED' AND confirmed_at IS NOT NULL AND cancelled_at IS NULL) OR (status = 'ATTENDED' AND confirmed_at IS NOT NULL AND attendance_marked_at IS NOT NULL) OR (status = 'NO_SHOW' AND confirmed_at IS NOT NULL AND (attendance_marked_at IS NOT NULL OR status_reason = 'LATE_CANCELLATION')) OR (status = 'CANCELLED' AND cancelled_at IS NOT NULL)),
	CONSTRAINT "chk_reservations_status_reason" CHECK ((status = 'CONFIRMED' AND status_reason IN ('MEMBER_BOOKED', 'WAITLIST_PROMOTED', 'RESCHEDULED')) OR (status = 'WAITLISTED' AND status_reason = 'MEMBER_JOINED_WAITLIST') OR (status = 'ATTENDED' AND status_reason = 'ATTENDANCE') OR (status = 'NO_SHOW' AND status_reason IN ('LATE_CANCELLATION', 'ATTENDANCE')) OR (status = 'CANCELLED' AND status_reason IN ('MEMBER_CANCELLED', 'ADMIN_CANCELLED', 'SESSION_CANCELLED', 'SERIES_CHANGED', 'WAITLIST_REMOVED', 'WAITLIST_EXPIRED', 'RESCHEDULED')))
);
--> statement-breakpoint
ALTER TABLE "app"."class_schedule_events" ADD CONSTRAINT "class_schedule_events_class_series_id_fkey" FOREIGN KEY ("class_series_id") REFERENCES "app"."class_series"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."class_schedule_events" ADD CONSTRAINT "class_schedule_events_class_session_id_fkey" FOREIGN KEY ("class_session_id") REFERENCES "app"."class_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."class_schedule_events" ADD CONSTRAINT "class_schedule_events_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "app"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."class_series" ADD CONSTRAINT "class_series_trainer_id_fkey" FOREIGN KEY ("trainer_id") REFERENCES "app"."trainers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."class_series" ADD CONSTRAINT "class_series_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "app"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."class_series" ADD CONSTRAINT "class_series_updated_by_user_id_fkey" FOREIGN KEY ("updated_by_user_id") REFERENCES "app"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."class_series_weekdays" ADD CONSTRAINT "class_series_weekdays_class_series_id_fkey" FOREIGN KEY ("class_series_id") REFERENCES "app"."class_series"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."class_sessions" ADD CONSTRAINT "class_sessions_class_series_id_fkey" FOREIGN KEY ("class_series_id") REFERENCES "app"."class_series"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."class_sessions" ADD CONSTRAINT "class_sessions_trainer_id_fkey" FOREIGN KEY ("trainer_id") REFERENCES "app"."trainers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."class_sessions" ADD CONSTRAINT "class_sessions_cancelled_by_user_id_fkey" FOREIGN KEY ("cancelled_by_user_id") REFERENCES "app"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."class_sessions" ADD CONSTRAINT "class_sessions_updated_by_user_id_fkey" FOREIGN KEY ("updated_by_user_id") REFERENCES "app"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."reservation_events" ADD CONSTRAINT "reservation_events_reservation_id_fkey" FOREIGN KEY ("reservation_id") REFERENCES "app"."reservations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."reservation_events" ADD CONSTRAINT "reservation_events_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "app"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."reservation_events" ADD CONSTRAINT "reservation_events_from_session_id_fkey" FOREIGN KEY ("from_session_id") REFERENCES "app"."class_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."reservation_events" ADD CONSTRAINT "reservation_events_to_session_id_fkey" FOREIGN KEY ("to_session_id") REFERENCES "app"."class_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."reservations" ADD CONSTRAINT "reservations_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "app"."class_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."reservations" ADD CONSTRAINT "reservations_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "app"."members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."reservations" ADD CONSTRAINT "reservations_rescheduled_from_fkey" FOREIGN KEY ("rescheduled_from_reservation_id") REFERENCES "app"."reservations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."reservations" ADD CONSTRAINT "reservations_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "app"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."reservations" ADD CONSTRAINT "reservations_updated_by_user_id_fkey" FOREIGN KEY ("updated_by_user_id") REFERENCES "app"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_class_schedule_events_series_occurred" ON "app"."class_schedule_events" USING btree ("class_series_id" uuid_ops,"occurred_at" timestamptz_ops);--> statement-breakpoint
CREATE INDEX "idx_class_schedule_events_session_occurred" ON "app"."class_schedule_events" USING btree ("class_session_id" uuid_ops,"occurred_at" timestamptz_ops);--> statement-breakpoint
CREATE INDEX "idx_class_series_status" ON "app"."class_series" USING btree ("status" enum_ops);--> statement-breakpoint
CREATE INDEX "idx_class_series_trainer_status" ON "app"."class_series" USING btree ("trainer_id" uuid_ops,"status" enum_ops);--> statement-breakpoint
CREATE INDEX "idx_class_sessions_starts_status" ON "app"."class_sessions" USING btree ("starts_at" timestamptz_ops,"status" enum_ops);--> statement-breakpoint
CREATE INDEX "idx_class_sessions_series_starts" ON "app"."class_sessions" USING btree ("class_series_id" uuid_ops,"starts_at" timestamptz_ops);--> statement-breakpoint
CREATE INDEX "idx_class_sessions_trainer_starts" ON "app"."class_sessions" USING btree ("trainer_id" uuid_ops,"starts_at" timestamptz_ops);--> statement-breakpoint
CREATE INDEX "idx_reservation_events_reservation_occurred" ON "app"."reservation_events" USING btree ("reservation_id" uuid_ops,"occurred_at" timestamptz_ops);--> statement-breakpoint
CREATE INDEX "idx_reservations_session_status_fifo" ON "app"."reservations" USING btree ("session_id" uuid_ops,"status" enum_ops,"waitlisted_at" timestamptz_ops,"id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_reservations_member_created" ON "app"."reservations" USING btree ("member_id" uuid_ops,"created_at" timestamptz_ops);--> statement-breakpoint
CREATE INDEX "idx_reservations_member_status_session" ON "app"."reservations" USING btree ("member_id" uuid_ops,"status" enum_ops,"session_id" uuid_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "uq_reservations_active_member_session" ON "app"."reservations" USING btree ("session_id","member_id") WHERE status <> 'CANCELLED';--> statement-breakpoint
CREATE UNIQUE INDEX "uq_reservations_reschedule_source" ON "app"."reservations" USING btree ("rescheduled_from_reservation_id") WHERE rescheduled_from_reservation_id IS NOT NULL;--> statement-breakpoint
CREATE EXTENSION IF NOT EXISTS btree_gist;--> statement-breakpoint
ALTER TABLE "app"."class_sessions" ADD CONSTRAINT "excl_class_sessions_trainer_overlap" EXCLUDE USING gist (trainer_id WITH =, tstzrange(starts_at, ends_at, '[)') WITH &&) WHERE (status = 'SCHEDULED');