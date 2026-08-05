-- Hand-written and idempotent (same as 0001/0003/0004/0005/0006).
--
-- A training plan is a weekly split — Monday back, Tuesday legs — so a member
-- holds several ACTIVE assignments at once. `focused` is the one the mobile home
-- leads with; it is a display preference, not a state of the plan.
--
-- The partial unique index is what makes "at most one focused per member" a
-- database guarantee instead of a service convention. It only counts live rows,
-- so a member can re-focus freely as assignments come and go.

ALTER TABLE "app"."member_routines"
    ADD COLUMN IF NOT EXISTS "focused" boolean DEFAULT false NOT NULL;
--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS "uq_member_routines_focused"
    ON "app"."member_routines" ("member_id")
    WHERE "focused" AND "status" = 'ACTIVE' AND "deleted_at" IS NULL;
