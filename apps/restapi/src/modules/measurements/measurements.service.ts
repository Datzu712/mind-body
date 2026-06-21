import { Injectable, NotFoundException } from '@nestjs/common';
import { and, desc, eq, gte, lte, sql, asc } from 'drizzle-orm';

import { DrizzleService } from '@/infra/database/pg/drizzle.service';
import { memberMeasurementsInApp as Measurements, membersInApp as Members } from '@/infra/database/pg/schemas/schema';
import type { CreateMeasurementDto } from './dto/create-measurement.dto';

@Injectable()
export class MeasurementsService {
    constructor(private readonly drizzle: DrizzleService) {}

    private async getMemberId(userId: string): Promise<string> {
        const [member] = await this.drizzle.db
            .select({ id: Members.id })
            .from(Members)
            .where(eq(Members.userId, userId));

        if (!member) throw new NotFoundException('Member not found');
        return member.id;
    }

    async create(userId: string, dto: CreateMeasurementDto) {
        const memberId = await this.getMemberId(userId);

        const [row] = await this.drizzle.db
            .insert(Measurements)
            .values({
                memberId,
                measuredAt: dto.measuredAt ?? sql`CURRENT_DATE`,
                weightKg: dto.weightKg != null ? String(dto.weightKg) : null,
                heightCm: dto.heightCm != null ? String(dto.heightCm) : null,
                bodyFatPercentage: dto.bodyFatPercentage != null ? String(dto.bodyFatPercentage) : null,
                waistCm: dto.waistCm != null ? String(dto.waistCm) : null,
                notes: dto.notes ?? null,
            })
            .returning();

        return row!;
    }

    async findAll(userId: string, from?: string, to?: string) {
        const memberId = await this.getMemberId(userId);

        const conditions = [eq(Measurements.memberId, memberId)];
        if (from) conditions.push(gte(Measurements.measuredAt, from));
        if (to) conditions.push(lte(Measurements.measuredAt, to));

        return this.drizzle.db
            .select()
            .from(Measurements)
            .where(and(...conditions))
            .orderBy(desc(Measurements.measuredAt));
    }

    async getSummary(userId: string) {
        const memberId = await this.getMemberId(userId);

        const all = await this.drizzle.db
            .select()
            .from(Measurements)
            .where(eq(Measurements.memberId, memberId))
            .orderBy(asc(Measurements.measuredAt));

        if (all.length === 0) {
            return {
                first: null,
                latest: null,
                variations: { weightKg: null, heightCm: null, bodyFatPercentage: null, waistCm: null },
                totalRecords: 0,
            };
        }

        const first = all[0]!;
        const latest = all[all.length - 1]!;

        const delta = (a: string | null, b: string | null) =>
            a != null && b != null ? +(parseFloat(b) - parseFloat(a)).toFixed(2) : null;

        return {
            first,
            latest,
            variations: {
                weightKg: delta(first.weightKg, latest.weightKg),
                heightCm: delta(first.heightCm, latest.heightCm),
                bodyFatPercentage: delta(first.bodyFatPercentage, latest.bodyFatPercentage),
                waistCm: delta(first.waistCm, latest.waistCm),
            },
            totalRecords: all.length,
        };
    }
}
