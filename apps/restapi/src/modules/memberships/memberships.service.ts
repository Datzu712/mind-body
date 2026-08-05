import { Injectable } from '@nestjs/common';
import { and, desc, eq, gte, isNull, lt, or } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';

import { ClockService } from '@/common/clock/clock.service';
import { DomainHttpException } from '@/common/domain/domain-http.exception';
import { DrizzleService } from '@/infra/database/pg/drizzle.service';
import {
    membersInApp as Members,
    membershipPlansInApp as MembershipPlans,
    membershipsInApp as Memberships,
} from '@/infra/database/pg/schemas/schema';
import type { CreateMembershipDto } from './dto/create-membership.dto';
import type { ListMembershipsQueryDto } from './dto/list-memberships-query.dto';
import { assertCancellable, isCancellable, type MembershipStatus } from './membership-cancel-policy';

/**
 * `plan_id` is NOT NULL but priced plans do not apply to this business (payments
 * happen at the front desk and are never modelled). Instead of migrating the
 * column to nullable, memberships created without an explicit plan point at this
 * placeholder row, seeded on first use.
 */
const DEFAULT_PLAN_NAME = 'General';
const DEFAULT_PLAN_DURATION_DAYS = 30;
const DEFAULT_PLAN_DESCRIPTION = 'Plan por defecto: el cobro se gestiona en recepción, fuera del sistema.';

/** Transaction handle handed to the callback of `db.transaction`. */
type Tx = Parameters<Parameters<DrizzleService['db']['transaction']>[0]>[0];

/** What the dashboard renders: the membership row plus its plan name. */
export interface MembershipDto {
    id: string;
    memberId: string;
    planId: string;
    planName: string;
    /** 'YYYY-MM-DD' */
    startDate: string;
    /** 'YYYY-MM-DD' */
    endDate: string;
    status: MembershipStatus;
    /**
     * True when `PATCH /memberships/:id/cancel` would be accepted right now.
     * The dashboard uses it to show the action; the API still re-checks.
     */
    cancellable: boolean;
    createdAt: string;
    updatedAt: string;
}

interface MembershipRow {
    id: string;
    memberId: string;
    planId: string;
    planName: string | null;
    startDate: string;
    endDate: string;
    status: MembershipStatus;
    createdAt: string;
    updatedAt: string;
}

@Injectable()
export class MembershipsService {
    constructor(
        private readonly drizzle: DrizzleService,
        private readonly clock: ClockService,
    ) {}

    /** Full history of one member, newest term first. */
    async findByMember(query: ListMembershipsQueryDto): Promise<MembershipDto[]> {
        await this.assertMemberExists(query.memberId);

        const rows = await this.selectMemberships(eq(Memberships.memberId, query.memberId));

        return rows.map((row) => this.toDto(row));
    }

    /**
     * The caller's own history, resolved from the authenticated user rather than
     * a supplied id, so it can never be pointed at another member. A user with no
     * member profile (staff, a trainer) simply has none — not an error.
     */
    async findMine(userId: string): Promise<MembershipDto[]> {
        const [member] = await this.drizzle.db
            .select({ id: Members.id })
            .from(Members)
            .where(and(eq(Members.userId, userId), isNull(Members.deletedAt)))
            .limit(1);

        if (!member) return [];

        const rows = await this.selectMemberships(eq(Memberships.memberId, member.id));

        return rows.map((row) => this.toDto(row));
    }

    /**
     * Create or renew — the same operation. A renewal is not an UPDATE: the
     * previous term stays in the history as EXPIRED and the new one is a fresh
     * row, so the member's timeline remains auditable.
     */
    async create(dto: CreateMembershipDto): Promise<MembershipDto> {
        if (dto.endDate < dto.startDate) {
            throw new DomainHttpException(
                409,
                'MEMBERSHIP_INVALID_DATES',
                'La fecha de vencimiento no puede ser anterior a la de inicio.',
                { startDate: dto.startDate, endDate: dto.endDate },
            );
        }

        await this.assertMemberExists(dto.memberId);

        const createdId = await this.drizzle.db.transaction(async (tx) => {
            const planId = dto.planId ? await this.assertPlanExists(tx, dto.planId) : await this.defaultPlanId(tx);

            // A renewal supersedes every ACTIVE row EXCEPT one still running that
            // the new term does not reach: the dashboard chains a renewal to start
            // the day after the current term ends, so paying early must not expire
            // the days already covered and leave the member with no live term in
            // between. Everything else is superseded — a row whose term already
            // lapsed is stale ACTIVE data (nothing sweeps it on a schedule) and an
            // overlapping row is genuinely replaced.
            //
            // CANCELLED rows are deliberately left alone: that member walked away,
            // and flipping them to EXPIRED would put them back in the
            // renewal-reminder list.
            await tx
                .update(Memberships)
                .set({ status: 'EXPIRED' })
                .where(
                    and(
                        eq(Memberships.memberId, dto.memberId),
                        eq(Memberships.status, 'ACTIVE'),
                        or(lt(Memberships.endDate, this.today()), gte(Memberships.endDate, dto.startDate)),
                    ),
                );

            const [created] = await tx
                .insert(Memberships)
                .values({
                    memberId: dto.memberId,
                    planId,
                    startDate: dto.startDate,
                    endDate: dto.endDate,
                    status: 'ACTIVE',
                })
                .returning({ id: Memberships.id });

            return created!.id;
        });

        return this.getOne(createdId);
    }

    /**
     * Stop chasing a member who left. The rule itself lives in
     * `membership-cancel-policy`: only a lapsed term can be cancelled.
     */
    async cancel(id: string, override = false): Promise<MembershipDto> {
        const membership = await this.getOne(id);

        assertCancellable(membership, this.today(), override);

        await this.drizzle.db.update(Memberships).set({ status: 'CANCELLED' }).where(eq(Memberships.id, id));

        return this.getOne(id);
    }

    private async getOne(id: string): Promise<MembershipDto> {
        const [row] = await this.selectMemberships(eq(Memberships.id, id));
        if (!row) {
            throw new DomainHttpException(404, 'MEMBERSHIP_NOT_FOUND', 'La membresía no existe.', { id });
        }
        return this.toDto(row);
    }

    private async selectMemberships(where: SQL): Promise<MembershipRow[]> {
        return this.drizzle.db
            .select({
                id: Memberships.id,
                memberId: Memberships.memberId,
                planId: Memberships.planId,
                planName: MembershipPlans.name,
                startDate: Memberships.startDate,
                endDate: Memberships.endDate,
                status: Memberships.status,
                createdAt: Memberships.createdAt,
                updatedAt: Memberships.updatedAt,
            })
            .from(Memberships)
            .leftJoin(MembershipPlans, eq(Memberships.planId, MembershipPlans.id))
            .where(and(where, isNull(Memberships.deletedAt)))
            .orderBy(desc(Memberships.startDate), desc(Memberships.createdAt));
    }

    private async assertMemberExists(memberId: string): Promise<void> {
        const [member] = await this.drizzle.db
            .select({ id: Members.id })
            .from(Members)
            .where(and(eq(Members.id, memberId), isNull(Members.deletedAt)));

        if (!member) {
            throw new DomainHttpException(404, 'MEMBER_NOT_FOUND', 'El miembro no existe.', { memberId });
        }
    }

    private async assertPlanExists(tx: Tx, planId: string): Promise<string> {
        const [plan] = await tx
            .select({ id: MembershipPlans.id })
            .from(MembershipPlans)
            .where(and(eq(MembershipPlans.id, planId), isNull(MembershipPlans.deletedAt)));

        if (!plan) {
            throw new DomainHttpException(404, 'MEMBERSHIP_PLAN_NOT_FOUND', 'El plan indicado no existe.', { planId });
        }
        return plan.id;
    }

    /**
     * Insert-then-select rather than insert-returning: `ON CONFLICT DO NOTHING`
     * returns zero rows when a concurrent transaction won the race, and the
     * follow-up select still finds the row that other transaction wrote.
     */
    private async defaultPlanId(tx: Tx): Promise<string> {
        await tx
            .insert(MembershipPlans)
            .values({
                name: DEFAULT_PLAN_NAME,
                durationDays: DEFAULT_PLAN_DURATION_DAYS,
                price: '0',
                description: DEFAULT_PLAN_DESCRIPTION,
            })
            .onConflictDoNothing({ target: MembershipPlans.name });

        const [plan] = await tx
            .select({ id: MembershipPlans.id })
            .from(MembershipPlans)
            .where(eq(MembershipPlans.name, DEFAULT_PLAN_NAME));

        return plan!.id;
    }

    /** Local business date ('YYYY-MM-DD'), the anchor of the cancel rule. */
    private today(): string {
        return this.clock.nowLocal().toISODate()!;
    }

    private toDto(row: MembershipRow): MembershipDto {
        const today = this.today();

        return {
            id: row.id,
            memberId: row.memberId,
            planId: row.planId,
            // Only null if the plan row was hard-deleted underneath us.
            planName: row.planName ?? DEFAULT_PLAN_NAME,
            startDate: row.startDate,
            endDate: row.endDate,
            status: row.status,
            cancellable: row.status !== 'CANCELLED' && isCancellable(row, today),
            // timestamptz arrives as raw Postgres text; normalize like the rest
            // of the modules do so clients can parse it.
            createdAt: this.clock.toLocal(row.createdAt).toISO()!,
            updatedAt: this.clock.toLocal(row.updatedAt).toISO()!,
        };
    }
}
