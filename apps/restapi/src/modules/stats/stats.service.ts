import { Injectable } from '@nestjs/common';
import { and, count, desc, eq, gte, inArray, isNull, lte, sql } from 'drizzle-orm';

import { ClockService } from '@/common/clock/clock.service';
import { DrizzleService } from '@/infra/database/pg/drizzle.service';
import {
    classSeriesInApp as ClassSeries,
    classSessionsInApp as Sessions,
    membersInApp as Members,
    reservationsInApp as Reservations,
    staffInApp as Staff,
    trainersInApp as Trainers,
    usersInApp as Users,
} from '@/infra/database/pg/schemas/schema';

/** Reservations that still hold a seat — cancelled ones must not inflate counts. */
const OCCUPYING_STATUSES = ['CONFIRMED', 'ATTENDED', 'NO_SHOW'] as const;

export interface StatsOverview {
    activeMembers: number;
    reservationsToday: number;
    sessionsToday: number;
    internalUsers: number;
    activeClasses: number;
    noShowsLast7Days: number;
}

export interface WeeklyReservationPoint {
    /** Monday of the bucket, as a business-local 'YYYY-MM-DD'. */
    week: string;
    total: number;
}

export interface PopularClassPoint {
    name: string;
    total: number;
}

export interface RecentReservation {
    id: string;
    memberName: string;
    className: string;
    status: string;
    /** When the booking was made, not when the class runs. */
    createdAt: string;
    startsAt: string;
}

/**
 * Read-only aggregates for the dashboard home. Every number here maps to a real
 * table: this module deliberately exposes no revenue or billing metric, because
 * payments happen in person and the system never records money.
 */
@Injectable()
export class StatsService {
    constructor(
        private readonly drizzle: DrizzleService,
        private readonly clock: ClockService,
    ) {}

    /** Business-local day bounds as UTC instants, for timestamptz comparisons. */
    private todayBounds(): { from: string; to: string } {
        const now = this.clock.nowLocal();
        return {
            from: now.startOf('day').toUTC().toISO() ?? '',
            to: now.endOf('day').toUTC().toISO() ?? '',
        };
    }

    private async scalar(query: Promise<{ value: number }[]>): Promise<number> {
        const [row] = await query;
        return Number(row?.value ?? 0);
    }

    async getOverview(): Promise<StatsOverview> {
        const { from, to } = this.todayBounds();
        // Inclusive on both ends: `to` is the end of today, so the window has to
        // start 6 days back to span 7 calendar days, not 8.
        const weekAgo = this.clock.nowLocal().minus({ days: 6 }).startOf('day').toUTC().toISO() ?? '';

        const db = this.drizzle.db;

        const [activeMembers, reservationsToday, sessionsToday, staffUsers, trainerUsers, activeClasses, noShows] =
            await Promise.all([
                this.scalar(
                    db
                        .select({ value: count() })
                        .from(Members)
                        .where(and(eq(Members.status, 'ACTIVE'), isNull(Members.deletedAt))),
                ),
                this.scalar(
                    db
                        .select({ value: count() })
                        .from(Reservations)
                        .innerJoin(Sessions, eq(Reservations.sessionId, Sessions.id))
                        .where(
                            and(
                                inArray(Reservations.status, [...OCCUPYING_STATUSES]),
                                gte(Sessions.startsAt, from),
                                lte(Sessions.startsAt, to),
                            ),
                        ),
                ),
                this.scalar(
                    db
                        .select({ value: count() })
                        .from(Sessions)
                        .where(
                            and(
                                eq(Sessions.status, 'SCHEDULED'),
                                gte(Sessions.startsAt, from),
                                lte(Sessions.startsAt, to),
                            ),
                        ),
                ),
                // User ids, not counts: the same person can hold a staff AND a
                // trainer profile, and `internalUsers` counts people.
                db
                    .selectDistinct({ userId: Staff.userId })
                    .from(Staff)
                    .where(and(eq(Staff.status, 'ACTIVE'), isNull(Staff.deletedAt))),
                db
                    .selectDistinct({ userId: Trainers.userId })
                    .from(Trainers)
                    .where(and(eq(Trainers.status, 'ACTIVE'), isNull(Trainers.deletedAt))),
                this.scalar(
                    db
                        .select({ value: count() })
                        .from(ClassSeries)
                        .where(and(eq(ClassSeries.status, 'ACTIVE'), isNull(ClassSeries.deletedAt))),
                ),
                this.scalar(
                    db
                        .select({ value: count() })
                        .from(Reservations)
                        .innerJoin(Sessions, eq(Reservations.sessionId, Sessions.id))
                        .where(
                            and(
                                eq(Reservations.status, 'NO_SHOW'),
                                gte(Sessions.startsAt, weekAgo),
                                lte(Sessions.startsAt, to),
                            ),
                        ),
                ),
            ]);

        const internalUserIds = new Set([...staffUsers, ...trainerUsers].map((row) => row.userId));

        return {
            activeMembers,
            reservationsToday,
            sessionsToday,
            internalUsers: internalUserIds.size,
            activeClasses,
            noShowsLast7Days: noShows,
        };
    }

    /** Reservation volume per ISO week, oldest first. Replaces the invented revenue series. */
    async getReservationsTrend(weeks: number): Promise<WeeklyReservationPoint[]> {
        const tz = this.clock.timeZone;
        const to = this.clock.nowLocal().endOf('day').toUTC().toISO() ?? '';
        const firstWeek = this.clock
            .nowLocal()
            .minus({ weeks: weeks - 1 })
            .startOf('week');
        const from = firstWeek.toUTC().toISO() ?? '';

        const bucket = sql<string>`to_char(date_trunc('week', ${Sessions.startsAt} AT TIME ZONE ${tz}), 'YYYY-MM-DD')`;

        const rows = await this.drizzle.db
            .select({ week: bucket, value: count() })
            .from(Reservations)
            .innerJoin(Sessions, eq(Reservations.sessionId, Sessions.id))
            .where(
                and(
                    inArray(Reservations.status, [...OCCUPYING_STATUSES]),
                    gte(Sessions.startsAt, from),
                    lte(Sessions.startsAt, to),
                ),
            )
            // Group/order by ordinal, not by repeating `bucket`: each interpolation of
            // the time zone emits a fresh placeholder ($1 vs $7), and Postgres compares
            // GROUP BY against SELECT structurally — different placeholders read as
            // different expressions and starts_at ends up ungrouped.
            .groupBy(sql`1`)
            .orderBy(sql`1`);

        // Zero-fill: GROUP BY only yields the weeks that have rows, but the chart
        // plots a categorical axis, so a dead week would not be drawn as a dip —
        // it would vanish and its neighbours would render as adjacent.
        const totals = new Map(rows.map((row) => [row.week, Number(row.value)]));

        return Array.from({ length: weeks }, (_, index) => {
            const week = firstWeek.plus({ weeks: index }).toISODate() ?? '';
            return { week, total: totals.get(week) ?? 0 };
        });
    }

    /**
     * Latest bookings, newest first. This is the dashboard's activity feed: the
     * `activity` module stores Health Connect daily summaries, not an audit log,
     * so reservations are the only real stream of "something just happened".
     */
    async getRecentReservations(limit: number): Promise<RecentReservation[]> {
        const rows = await this.drizzle.db
            .select({
                id: Reservations.id,
                memberName: Users.fullName,
                className: Sessions.className,
                status: Reservations.status,
                createdAt: Reservations.createdAt,
                startsAt: Sessions.startsAt,
            })
            .from(Reservations)
            .innerJoin(Sessions, eq(Reservations.sessionId, Sessions.id))
            .innerJoin(Members, eq(Reservations.memberId, Members.id))
            .innerJoin(Users, eq(Members.userId, Users.id))
            .where(isNull(Members.deletedAt))
            .orderBy(desc(Reservations.createdAt))
            .limit(limit);

        // timestamptz arrives as raw Postgres text ('2026-08-05 13:44:00+00'),
        // which `new Date()` rejects outside V8; normalize like the rest of the
        // modules do so clients can parse it.
        return rows.map((row) => ({
            ...row,
            createdAt: this.clock.toLocal(row.createdAt).toISO() ?? row.createdAt,
            startsAt: this.clock.toLocal(row.startsAt).toISO() ?? row.startsAt,
        }));
    }

    /** Most reserved classes in the window, by the session's class-name snapshot. */
    async getPopularClasses(limit: number, days: number): Promise<PopularClassPoint[]> {
        const to = this.clock.nowLocal().endOf('day').toUTC().toISO() ?? '';
        // `days - 1`: the window is inclusive of today, so `minus({ days })` would
        // span one calendar day more than asked for.
        const from =
            this.clock
                .nowLocal()
                .minus({ days: days - 1 })
                .startOf('day')
                .toUTC()
                .toISO() ?? '';

        const rows = await this.drizzle.db
            .select({ name: Sessions.className, value: count() })
            .from(Reservations)
            .innerJoin(Sessions, eq(Reservations.sessionId, Sessions.id))
            .where(
                and(
                    inArray(Reservations.status, [...OCCUPYING_STATUSES]),
                    gte(Sessions.startsAt, from),
                    lte(Sessions.startsAt, to),
                ),
            )
            .groupBy(Sessions.className)
            .orderBy(desc(count()))
            .limit(limit);

        return rows.map((row) => ({ name: row.name, total: Number(row.value) }));
    }
}
