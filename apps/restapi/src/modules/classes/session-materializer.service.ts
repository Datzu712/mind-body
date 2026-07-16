import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { eq, sql } from 'drizzle-orm';
import { DateTime } from 'luxon';

import { DrizzleService } from '@/infra/database/pg/drizzle.service';
import {
    classScheduleEventsInApp,
    classSeriesInApp,
    classSeriesWeekdaysInApp,
    classSessionsInApp,
    type ClassSeries,
} from '@/infra/database/pg/schemas/schema';
import { TypedConfigService } from '@/config/typed-config.service';
import { pgErrorCode } from '@/infra/database/pg/pg-error';
import type { DbTx } from '@/infra/database/pg/drizzle.types';
import { ClockService } from '@/common/clock/clock.service';

export type MaterializeCause = 'cron' | 'create' | 'update' | 'activate';

/**
 * Fechas locales (YYYY-MM-DD) de la recurrencia dentro de la ventana
 * semiabierta `[today, today + weeksAhead*7)`, empezando en
 * `max(today, startsOn)`. Pura: la zona no importa para el weekday de una
 * fecha de calendario.
 */
export function occurrenceLocalDates(params: {
    startsOn: string;
    weekdays: readonly number[];
    today: string;
    weeksAhead: number;
}): string[] {
    const today = DateTime.fromISO(params.today);
    const startsOn = DateTime.fromISO(params.startsOn);
    const first = startsOn > today ? startsOn : today;
    const end = today.plus({ days: params.weeksAhead * 7 });
    const wanted = new Set(params.weekdays);

    const dates: string[] = [];
    for (let cursor = first; cursor < end; cursor = cursor.plus({ days: 1 })) {
        if (wanted.has(cursor.weekday)) dates.push(cursor.toISODate()!);
    }
    return dates;
}

interface MaterializerMetrics {
    cause: MaterializeCause;
    seriesScanned: number;
    sessionsInserted: number;
    conflicts: number;
    durationMs: number;
}

/**
 * Materializador idempotente: mantiene un horizonte rodante de
 * SESSION_MATERIALIZATION_WEEKS_AHEAD semanas de sesiones para las series
 * ACTIVE. La identidad de ocurrencia es el unique (class_series_id,
 * origin_date) + ON CONFLICT DO NOTHING; nunca actualiza ni revive filas.
 */
@Injectable()
export class SessionMaterializerService {
    private readonly logger = new Logger(SessionMaterializerService.name);
    readonly weeksAhead: number;

    constructor(
        private readonly drizzle: DrizzleService,
        private readonly clock: ClockService,
        configService: TypedConfigService,
    ) {
        this.weeksAhead = configService.getOrThrow('SESSION_MATERIALIZATION_WEEKS_AHEAD');
    }

    /**
     * Materializa las ocurrencias faltantes de UNA serie dentro de la
     * transacción de un comando (create/update/activate). El llamador YA debe
     * tener la fila de la serie bloqueada (FOR UPDATE): acá se relee para
     * calcular con el snapshot confirmado. NO absorbe 23P01: un conflicto de
     * entrenador revierte el comando completo (Task 5 lo mapea a 409).
     */
    async materializeSeriesInTx(
        tx: DbTx,
        seriesId: string,
        cause: Exclude<MaterializeCause, 'cron'>,
        actorUserId: string | null,
    ): Promise<number> {
        const [series] = await tx.select().from(classSeriesInApp).where(eq(classSeriesInApp.id, seriesId));
        if (!series || series.status !== 'ACTIVE') return 0;

        const rows = await this.buildMissingRows(tx, series);
        if (rows.length === 0) return 0;

        const inserted = await tx
            .insert(classSessionsInApp)
            .values(rows)
            .onConflictDoNothing({ target: [classSessionsInApp.classSeriesId, classSessionsInApp.originDate] })
            .returning({ id: classSessionsInApp.id });

        if (inserted.length > 0) {
            await tx.insert(classScheduleEventsInApp).values({
                classSeriesId: seriesId,
                eventType: 'MATERIALIZED',
                actorUserId,
                afterState: { inserted: inserted.length, cause },
            });
        }
        return inserted.length;
    }

    /** Cada hora, en un minuto no cero, repara faltantes del horizonte. */
    @Cron('0 7 * * * *')
    async runScheduled(): Promise<void> {
        try {
            await this.run('cron');
        } catch (error) {
            this.logger.error('Scheduled materialization failed', error);
        }
    }

    /**
     * Corrida completa: advisory lock transaccional (si otra réplica lo tiene,
     * termina sin error), lock por fila de serie y savepoint por ocurrencia
     * para que un 23P01 (solape de entrenador) descarte SOLO esa ocurrencia.
     */
    async run(cause: MaterializeCause): Promise<MaterializerMetrics | null> {
        const startedAt = Date.now();
        const metrics: MaterializerMetrics = {
            cause,
            seriesScanned: 0,
            sessionsInserted: 0,
            conflicts: 0,
            durationMs: 0,
        };
        let lockAcquired = false;

        await this.drizzle.db.transaction(async (tx) => {
            const lockRows = (await tx.execute(
                sql`SELECT pg_try_advisory_xact_lock(hashtext('mab:class-session-materializer')) AS locked`,
            )) as unknown as Array<{ locked: boolean }>;
            if (!lockRows[0]?.locked) return;
            lockAcquired = true;

            const candidates = await tx
                .select({ id: classSeriesInApp.id })
                .from(classSeriesInApp)
                .where(eq(classSeriesInApp.status, 'ACTIVE'));

            for (const candidate of candidates) {
                // Releer bajo lock: un edit concurrente nunca queda pisado por
                // un snapshot viejo (el edit también bloquea esta fila).
                const [series] = await tx
                    .select()
                    .from(classSeriesInApp)
                    .where(eq(classSeriesInApp.id, candidate.id))
                    .for('update');
                if (!series || series.status !== 'ACTIVE') continue;
                metrics.seriesScanned++;

                const rows = await this.buildMissingRows(tx, series);
                for (const row of rows) {
                    try {
                        await tx.transaction(async (sp) => {
                            const inserted = await sp
                                .insert(classSessionsInApp)
                                .values(row)
                                .onConflictDoNothing({
                                    target: [classSessionsInApp.classSeriesId, classSessionsInApp.originDate],
                                })
                                .returning({ id: classSessionsInApp.id });
                            metrics.sessionsInserted += inserted.length;
                        });
                    } catch (error) {
                        if (pgErrorCode(error) === '23P01') {
                            metrics.conflicts++;
                            this.logger.warn(
                                `Trainer overlap materializing series=${series.id} date=${row.originDate}; occurrence skipped`,
                            );
                            continue;
                        }
                        throw error;
                    }
                }

                if (metrics.sessionsInserted > 0) {
                    await tx.insert(classScheduleEventsInApp).values({
                        classSeriesId: series.id,
                        eventType: 'MATERIALIZED',
                        actorUserId: null,
                        afterState: { cause },
                    });
                }
            }
        });

        if (!lockAcquired) {
            this.logger.debug('Materializer lock busy: another replica is running');
            return null;
        }
        metrics.durationMs = Date.now() - startedAt;
        this.logger.log(
            `Materializer ${cause}: scanned=${metrics.seriesScanned} inserted=${metrics.sessionsInserted} conflicts=${metrics.conflicts} in ${metrics.durationMs}ms`,
        );
        return metrics;
    }

    /** Filas faltantes (futuras) de la serie según su recurrencia vigente. */
    private async buildMissingRows(tx: DbTx, series: ClassSeries) {
        const weekdayRows = await tx
            .select({ isoWeekday: classSeriesWeekdaysInApp.isoWeekday })
            .from(classSeriesWeekdaysInApp)
            .where(eq(classSeriesWeekdaysInApp.classSeriesId, series.id));

        const now = this.clock.now();
        const dates = occurrenceLocalDates({
            startsOn: series.startsOn,
            weekdays: weekdayRows.map((r) => r.isoWeekday),
            today: this.clock.nowLocal().toISODate()!,
            weeksAhead: this.weeksAhead,
        });

        const rows = [];
        for (const originDate of dates) {
            const startsAt = this.clock.fromLocal(originDate, series.localStartTime);
            // Nunca materializar retrospectivamente una sesión ya iniciada.
            if (startsAt <= now) continue;
            rows.push({
                classSeriesId: series.id,
                originDate,
                startsAt: startsAt.toISO()!,
                endsAt: startsAt.plus({ minutes: series.durationMinutes }).toISO()!,
                className: series.name,
                description: series.description,
                trainerId: series.trainerId,
                capacity: series.capacity,
                allowWaitlist: series.allowWaitlist,
                category: series.category,
                level: series.level,
                room: series.room,
                zone: series.zone,
                sourceSeriesVersion: series.version,
                updatedByUserId: null,
            });
        }
        return rows;
    }
}
