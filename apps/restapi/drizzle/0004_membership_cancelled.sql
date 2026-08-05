-- Hand-written and idempotent (same as 0001/0003): `ADD VALUE IF NOT EXISTS`
-- makes re-running the file against an already-migrated database a no-op.
--
-- CANCELLED closes the loop that EXPIRED left open: a lapsed membership is
-- still worth a renewal reminder, a cancelled one is not.
--
-- Postgres 12+ accepts ALTER TYPE ... ADD VALUE inside a transaction block (the
-- migrator wraps every migration in one) as long as the new label is not USED
-- in the same transaction — this file only declares it.
ALTER TYPE "app"."membership_status" ADD VALUE IF NOT EXISTS 'CANCELLED';
