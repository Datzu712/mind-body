import { Injectable, NotFoundException } from '@nestjs/common';
import { and, desc, eq, gte, lte, sql } from 'drizzle-orm';

import { DrizzleService } from '@/infra/database/pg/drizzle.service';
import {
    dailyActivitySummariesInApp as DailyActivity,
    membersInApp as Members,
} from '@/infra/database/pg/schemas/schema';
import type { UpsertDailyActivityDto } from './dto/upsert-daily-activity.dto';

@Injectable()
export class ActivityService {
    constructor(private readonly drizzle: DrizzleService) {}

    // todo: move to a dedicated MemberService if more member-related logic appears
    private async getMemberId(userId: string): Promise<string> {
        const [member] = await this.drizzle.db
            .select({ id: Members.id })
            .from(Members)
            .where(eq(Members.userId, userId));

        if (!member) throw new NotFoundException('Member not found');
        return member.id;
    }

    async upsert(userId: string, dto: UpsertDailyActivityDto) {
        const memberId = await this.getMemberId(userId);

        const [row] = await this.drizzle.db
            .insert(DailyActivity)
            .values({
                memberId,
                date: dto.date,
                steps: dto.steps ?? 0,
                caloriesTotal: String(dto.caloriesTotal ?? 0),
                activeMinutes: dto.activeMinutes ?? 0,
                exerciseCount: dto.exerciseCount ?? 0,
                distanceMeters: String(dto.distanceMeters ?? 0),
                source: dto.source,
            })
            .onConflictDoUpdate({
                target: [DailyActivity.memberId, DailyActivity.date],
                set: {
                    steps: dto.steps ?? 0,
                    caloriesTotal: String(dto.caloriesTotal ?? 0),
                    activeMinutes: dto.activeMinutes ?? 0,
                    exerciseCount: dto.exerciseCount ?? 0,
                    distanceMeters: String(dto.distanceMeters ?? 0),
                    source: dto.source,
                    updatedAt: sql`now()`,
                },
            })
            .returning();

        return row!;
    }

    async upsertBatch(userId: string, items: UpsertDailyActivityDto[]) {
        const memberId = await this.getMemberId(userId);

        const rows = [];
        for (const dto of items) {
            const [row] = await this.drizzle.db
                .insert(DailyActivity)
                .values({
                    memberId,
                    date: dto.date,
                    steps: dto.steps ?? 0,
                    caloriesTotal: String(dto.caloriesTotal ?? 0),
                    activeMinutes: dto.activeMinutes ?? 0,
                    exerciseCount: dto.exerciseCount ?? 0,
                    distanceMeters: String(dto.distanceMeters ?? 0),
                    source: dto.source,
                })
                .onConflictDoUpdate({
                    target: [DailyActivity.memberId, DailyActivity.date],
                    set: {
                        steps: dto.steps ?? 0,
                        caloriesTotal: String(dto.caloriesTotal ?? 0),
                        activeMinutes: dto.activeMinutes ?? 0,
                        exerciseCount: dto.exerciseCount ?? 0,
                        distanceMeters: String(dto.distanceMeters ?? 0),
                        source: dto.source,
                        updatedAt: sql`now()`,
                    },
                })
                .returning();
            rows.push(row!);
        }

        return rows;
    }

    async getByDate(userId: string, date: string) {
        const memberId = await this.getMemberId(userId);

        const [row] = await this.drizzle.db
            .select()
            .from(DailyActivity)
            .where(and(eq(DailyActivity.memberId, memberId), eq(DailyActivity.date, date)));

        return row ?? null;
    }

    async getRange(userId: string, from: string, to: string) {
        const memberId = await this.getMemberId(userId);

        return this.drizzle.db
            .select()
            .from(DailyActivity)
            .where(
                and(eq(DailyActivity.memberId, memberId), gte(DailyActivity.date, from), lte(DailyActivity.date, to)),
            )
            .orderBy(desc(DailyActivity.date));
    }
}
