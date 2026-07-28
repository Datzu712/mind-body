import { Injectable, NotFoundException } from '@nestjs/common';
import { and, desc, eq, gte, lte, sql, asc } from 'drizzle-orm';

import { ClockService } from '@/common/clock/clock.service';
import { DomainHttpException } from '@/common/domain/domain-http.exception';
import { DrizzleService } from '@/infra/database/pg/drizzle.service';
import { memberMeasurementsInApp as Measurements, membersInApp as Members } from '@/infra/database/pg/schemas/schema';
import type { CreateMeasurementDto } from './dto/create-measurement.dto';
import type { MeasurementValuesDto } from './dto/measurement-values.dto';
import { assertEditable } from './measurement-edit-policy';

/**
 * Las columnas `numeric` viajan como string en drizzle.
 *
 * El `!= null` es deliberado y no se puede cambiar por `!== undefined`: si el
 * cliente manda un `null` explícito, `@IsOptional()` de class-validator saltea
 * el resto de los validadores y ese null llega hasta acá. `String(null)` daría
 * `"null"`, que Postgres rechaza como numeric y sale como 500.
 */
const toNumeric = (value: number | null | undefined): string | null => (value != null ? String(value) : null);

@Injectable()
export class MeasurementsService {
    constructor(
        private readonly drizzle: DrizzleService,
        private readonly clock: ClockService,
    ) {}

    private async getMemberId(userId: string): Promise<string> {
        const [member] = await this.drizzle.db
            .select({ id: Members.id })
            .from(Members)
            .where(eq(Members.userId, userId));

        if (!member) throw new NotFoundException('Member not found');
        return member.id;
    }

    /**
     * Los timestamptz salen del driver con el texto crudo de Postgres
     * (`2026-07-28 22:06:11.646084+00`), que Hermes no parsea con `new Date()`.
     * Toda salida del módulo pasa por acá, igual que en sesiones y reservas.
     */
    private toDto<T extends { createdAt: string; updatedAt: string }>(row: T): T {
        return {
            ...row,
            createdAt: this.clock.toLocal(row.createdAt).toISO()!,
            updatedAt: this.clock.toLocal(row.updatedAt).toISO()!,
        };
    }

    /**
     * Mapeo único de valores digitados a columnas, compartido por crear y corregir:
     * agregar una métrica se hace en un solo lugar y no puede quedar a medias.
     */
    private toColumns(dto: MeasurementValuesDto) {
        return {
            weightKg: toNumeric(dto.weightKg),
            heightCm: toNumeric(dto.heightCm),
            bodyFatPercentage: toNumeric(dto.bodyFatPercentage),
            waistCm: toNumeric(dto.waistCm),
            notes: dto.notes ?? null,
        };
    }

    async create(userId: string, dto: CreateMeasurementDto) {
        const memberId = await this.getMemberId(userId);

        const [row] = await this.drizzle.db
            .insert(Measurements)
            .values({
                memberId,
                measuredAt: dto.measuredAt ?? sql`CURRENT_DATE`,
                ...this.toColumns(dto),
            })
            .returning();

        return this.toDto(row!);
    }

    /**
     * Corrige los valores de una medición propia. Reemplazo total: un campo
     * ausente en el body borra el valor guardado.
     */
    async update(userId: string, measurementId: string, dto: MeasurementValuesDto) {
        const memberId = await this.getMemberId(userId);

        // El memberId va en el WHERE y no en una comparación posterior: una medición
        // ajena responde igual que una inexistente, así que no queda un oráculo para
        // averiguar qué ids existen.
        const [existing] = await this.drizzle.db
            .select({ createdAt: Measurements.createdAt })
            .from(Measurements)
            .where(and(eq(Measurements.id, measurementId), eq(Measurements.memberId, memberId)));

        if (!existing) {
            throw new DomainHttpException(
                404,
                'MEASUREMENT_NOT_FOUND',
                'La medición no existe o no pertenece al usuario.',
                { measurementId },
            );
        }

        // Sin lock ni transacción a propósito: `createdAt` es inmutable y no hay
        // borrado de mediciones, así que entre el SELECT y el UPDATE nada puede
        // cambiar el resultado de la regla. El UPDATE repite el filtro por memberId.
        assertEditable(this.clock.toLocal(existing.createdAt), this.clock.now());

        const [row] = await this.drizzle.db
            .update(Measurements)
            .set({ ...this.toColumns(dto), updatedAt: sql`now()` })
            .where(and(eq(Measurements.id, measurementId), eq(Measurements.memberId, memberId)))
            .returning();

        return this.toDto(row!);
    }

    async findAll(userId: string, from?: string, to?: string) {
        const memberId = await this.getMemberId(userId);

        const conditions = [eq(Measurements.memberId, memberId)];
        if (from) conditions.push(gte(Measurements.measuredAt, from));
        if (to) conditions.push(lte(Measurements.measuredAt, to));

        const rows = await this.drizzle.db
            .select()
            .from(Measurements)
            .where(and(...conditions))
            .orderBy(desc(Measurements.measuredAt));

        return rows.map((row) => this.toDto(row));
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
            first: this.toDto(first),
            latest: this.toDto(latest),
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
