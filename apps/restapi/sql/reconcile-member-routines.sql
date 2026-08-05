-- ═══════════════════════════════════════════════════════════════════════════
-- One-off reconciliation: a member must follow ONE routine at a time.
--
-- `app.member_routines` models an assignment WITH history (assigned_at /
-- ended_at / status), so more than one ACTIVE row per member is inconsistent
-- data: `GET /routines/mine` returns them all and mobile silently shows the
-- most recently assigned one. `RoutinesService.assign` now closes the running
-- term before opening a new one, but rows created before that fix are still
-- there — this script closes them.
--
-- Rule applied: keep the most recent ACTIVE assignment per member
-- (assigned_at DESC, then created_at DESC, then id DESC — uuidv7 is
-- time-ordered, so id breaks a same-instant tie the same way), and close every
-- older one as INACTIVE.
--
-- `ended_at = GREATEST(assigned_at, CURRENT_DATE)` mirrors the service: it
-- satisfies `chk_member_routine_dates` (ended_at >= assigned_at) even for a row
-- whose assigned_at is ahead of today, which happens when the database server
-- runs in UTC and the gym does not.
--
-- NOTE: CURRENT_DATE is the DATABASE server's date. If it does not match the
-- business date (BUSINESS_TIME_ZONE), replace it with a literal 'YYYY-MM-DD'
-- in both places below.
--
-- HOW TO RUN — step 1 is a read-only preview, run it alone first:
--
--   psql -h localhost -U mab -d mab -f reconcile-member-routines.sql
--
-- The script is wrapped in a transaction that ENDS IN ROLLBACK on purpose, so
-- running it as-is changes nothing and only prints what it would do. Switch the
-- last line to COMMIT once the preview looks right.
--
-- Idempotent: re-running it after a successful commit selects nothing, because
-- every member is left with a single ACTIVE row.
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1) Preview: the rows that would be closed ──────────────────────────────
WITH ranked AS (
    SELECT
        mr.id,
        mr.member_id,
        mr.routine_id,
        mr.assigned_at,
        ROW_NUMBER() OVER (
            PARTITION BY mr.member_id
            ORDER BY mr.assigned_at DESC, mr.created_at DESC, mr.id DESC
        ) AS rn
    FROM app.member_routines mr
    WHERE mr.status = 'ACTIVE'
      AND mr.deleted_at IS NULL
)
SELECT
    u.full_name                              AS member,
    r.name                                   AS routine,
    ranked.assigned_at,
    GREATEST(ranked.assigned_at, CURRENT_DATE) AS would_end_at
FROM ranked
JOIN app.members m ON m.id = ranked.member_id
JOIN app.users u ON u.id = m.user_id
JOIN app.routines r ON r.id = ranked.routine_id
WHERE ranked.rn > 1
ORDER BY u.full_name, ranked.assigned_at DESC;

-- ── 2) The fix: close every ACTIVE assignment but the most recent one ──────
WITH ranked AS (
    SELECT
        mr.id,
        ROW_NUMBER() OVER (
            PARTITION BY mr.member_id
            ORDER BY mr.assigned_at DESC, mr.created_at DESC, mr.id DESC
        ) AS rn
    FROM app.member_routines mr
    WHERE mr.status = 'ACTIVE'
      AND mr.deleted_at IS NULL
)
UPDATE app.member_routines mr
SET status   = 'INACTIVE',
    ended_at = GREATEST(mr.assigned_at, CURRENT_DATE)
FROM ranked
WHERE mr.id = ranked.id
  AND ranked.rn > 1;

-- ── 3) Verification: must return zero rows after the fix ───────────────────
SELECT member_id, COUNT(*) AS active_assignments
FROM app.member_routines
WHERE status = 'ACTIVE' AND deleted_at IS NULL
GROUP BY member_id
HAVING COUNT(*) > 1;

-- Change to COMMIT to actually apply the fix.
ROLLBACK;
