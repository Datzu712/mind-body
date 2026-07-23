import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { and, desc, eq, gte, lte, sql, asc } from 'drizzle-orm';

import { DrizzleService } from '@/infra/database/pg/drizzle.service';
import { memberMeasurementsInApp as Measurements, membersInApp as Members } from '@/infra/database/pg/schemas/schema';
import type { CreateMeasurementDto } from './dto/create-measurement.dto';
import type { UpdateMeasurementDto } from './dto/update-measurement.dto';

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

    async update(userId: string, id: string, dto: UpdateMeasurementDto) {
        const memberId = await this.getMemberId(userId);

        const [measurement] = await this.drizzle.db
            .select()
            .from(Measurements)
            .where(and(eq(Measurements.id, id), eq(Measurements.memberId, memberId)));

        if (!measurement) throw new NotFoundException('Measurement not found');

        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - 7);
        cutoff.setHours(0, 0, 0, 0);
        if (new Date(`${measurement.measuredAt}T00:00:00`) < cutoff) {
            throw new ForbiddenException('No se pueden editar mediciones de más de 7 días');
        }

        const updates: Partial<typeof Measurements.$inferInsert> = {};
        if (dto.weightKg !== undefined) updates.weightKg = String(dto.weightKg);
        if (dto.heightCm !== undefined) updates.heightCm = String(dto.heightCm);
        if (dto.bodyFatPercentage !== undefined) updates.bodyFatPercentage = String(dto.bodyFatPercentage);
        if (dto.waistCm !== undefined) updates.waistCm = String(dto.waistCm);
        if (dto.notes !== undefined) updates.notes = dto.notes;

        if (Object.keys(updates).length === 0) return measurement;

        const [row] = await this.drizzle.db
            .update(Measurements)
            .set(updates)
            .where(eq(Measurements.id, measurement.id))
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
