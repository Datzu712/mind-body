import { Injectable } from '@nestjs/common';
import { and, asc, count, eq, gt, ilike, inArray, ne } from 'drizzle-orm';
import { DateTime } from 'luxon';

import { DrizzleService } from '@/infra/database/pg/drizzle.service';
import {
    classScheduleEventsInApp,
    classSeriesInApp,
    classSeriesWeekdaysInApp,
    classSessionsInApp,
    reservationEventsInApp,
    reservationsInApp,
    trainersInApp,
    usersInApp,
    type ClassSeries,
    type ClassSessionRow,
} from '@/infra/database/pg/schemas/schema';
import { pgErrorCode } from '@/infra/database/pg/pg-error';
import type { DbTx } from '@/infra/database/pg/drizzle.types';
import { ClockService } from '@/common/clock/clock.service';
import { DomainHttpException } from '@/common/domain/domain-http.exception';
import { assertVersion } from '@/common/domain/assert-version';
import { isTrainerScoped, requireTrainerId, type Actor } from '@/common/auth/actor';
import { SessionMaterializerService } from './session-materializer.service';
import type { CreateClassDto, ListClassesQueryDto, SetClassStatusDto, UpdateClassDto } from './dto/class.dtos';
import type { ClassMutationResult, ClassSeriesDto, MutationImpact, TrainerSummary } from './class.types';

/** Estados de reserva que ocupan cupo. */
const OCCUPYING = ['CONFIRMED', 'ATTENDED', 'NO_SHOW'] as const;

const ZERO_IMPACT: MutationImpact = { affectedSessions: 0, affectedReservations: 0, cancelledReservations: 0 };

/** Weekday ISO (1-7) de una fecha de calendario YYYY-MM-DD. */
function isoWeekdayOf(date: string): number {
    return DateTime.fromISO(date).weekday;
}

@Injectable()
export class ClassesService {
    constructor(
        private readonly drizzle: DrizzleService,
        private readonly clock: ClockService,
        private readonly materializer: SessionMaterializerService,
    ) {}

    async list(query: ListClassesQueryDto, actor: Actor): Promise<ClassSeriesDto[]> {
        const conditions = [
            query.status ? eq(classSeriesInApp.status, query.status) : ne(classSeriesInApp.status, 'ARCHIVED'),
        ];
        if (query.trainerId) conditions.push(eq(classSeriesInApp.trainerId, query.trainerId));
        if (query.q?.trim()) conditions.push(ilike(classSeriesInApp.name, `%${query.q.trim()}%`));
        if (isTrainerScoped(actor)) {
            const trainerId = await requireTrainerId(this.drizzle.db, actor.userId);
            conditions.push(eq(classSeriesInApp.trainerId, trainerId));
        }

        const rows = await this.drizzle.db
            .select({ series: classSeriesInApp, trainerName: usersInApp.fullName })
            .from(classSeriesInApp)
            .innerJoin(trainersInApp, eq(classSeriesInApp.trainerId, trainersInApp.id))
            .innerJoin(usersInApp, eq(trainersInApp.userId, usersInApp.id))
            .where(and(...conditions))
            .orderBy(asc(classSeriesInApp.name));

        const weekdaysBySeries = await this.weekdaysFor(rows.map((r) => r.series.id));
        return rows.map((r) => this.toDto(r.series, weekdaysBySeries.get(r.series.id) ?? [], r.trainerName));
    }

    async detail(id: string, actor: Actor): Promise<ClassSeriesDto> {
        const [row] = await this.drizzle.db
            .select({ series: classSeriesInApp, trainerName: usersInApp.fullName })
            .from(classSeriesInApp)
            .innerJoin(trainersInApp, eq(classSeriesInApp.trainerId, trainersInApp.id))
            .innerJoin(usersInApp, eq(trainersInApp.userId, usersInApp.id))
            .where(eq(classSeriesInApp.id, id));
        if (!row) throw new DomainHttpException(404, 'CLASS_NOT_FOUND', 'La clase no existe.', { classId: id });
        if (isTrainerScoped(actor)) {
            const trainerId = await requireTrainerId(this.drizzle.db, actor.userId);
            if (row.series.trainerId !== trainerId) {
                // Mismo código que un 404 para no filtrar la existencia de la serie.
                throw new DomainHttpException(403, 'CLASS_NOT_FOUND', 'La clase no pertenece al entrenador.', {
                    classId: id,
                });
            }
        }
        const weekdays = await this.weekdaysFor([id]);
        return this.toDto(row.series, weekdays.get(id) ?? [], row.trainerName);
    }

    async trainerOptions(): Promise<TrainerSummary[]> {
        return await this.drizzle.db
            .select({ id: trainersInApp.id, name: usersInApp.fullName })
            .from(trainersInApp)
            .innerJoin(usersInApp, eq(trainersInApp.userId, usersInApp.id))
            .where(and(eq(trainersInApp.status, 'ACTIVE'), eq(usersInApp.status, 'ACTIVE')))
            .orderBy(asc(usersInApp.fullName));
    }

    // ── Comandos ────────────────────────────────────────────────────────────

    async create(dto: CreateClassDto, actorUserId: string): Promise<ClassMutationResult> {
        return await this.mapTrainerConflict(
            this.drizzle.db.transaction(async (tx) => {
                await this.assertTrainerActive(tx, dto.trainerId);
                const nowIso = this.clock.now().toISO()!;

                const [series] = await tx
                    .insert(classSeriesInApp)
                    .values({
                        ...this.seriesColumns(dto),
                        status: dto.status,
                        createdByUserId: actorUserId,
                        updatedByUserId: actorUserId,
                    })
                    .returning();

                await tx
                    .insert(classSeriesWeekdaysInApp)
                    .values(dto.weekdays.map((isoWeekday) => ({ classSeriesId: series!.id, isoWeekday })));

                const materialized =
                    series!.status === 'ACTIVE'
                        ? await this.materializer.materializeSeriesInTx(tx, series!.id, 'create', actorUserId)
                        : 0;

                await tx.insert(classScheduleEventsInApp).values({
                    classSeriesId: series!.id,
                    eventType: 'CREATED',
                    actorUserId,
                    afterState: series,
                    occurredAt: nowIso,
                });

                return {
                    classSeries: await this.dtoInTx(tx, series!.id),
                    impact: { ...ZERO_IMPACT, affectedSessions: materialized },
                };
            }),
        );
    }

    async update(id: string, dto: UpdateClassDto, actorUserId: string, ifMatch?: string): Promise<ClassMutationResult> {
        return await this.mapTrainerConflict(
            this.drizzle.db.transaction(async (tx) => {
                const series = await this.lockSeries(tx, id);
                if (series.status === 'ARCHIVED') {
                    throw new DomainHttpException(409, 'CLASS_ARCHIVED', 'La clase está archivada.', { classId: id });
                }
                assertVersion(ifMatch, series.version);
                await this.assertTrainerActive(tx, dto.trainerId);

                const nowIso = this.clock.now().toISO()!;
                const future = await this.lockFutureSessions(tx, id);
                const affectedReservations = await this.countActiveReservations(
                    tx,
                    future.map((s) => s.id),
                );

                // Clasificar futuras contra la nueva recurrencia.
                const wanted = new Set(dto.weekdays);
                const matches = (s: ClassSessionRow) =>
                    wanted.has(isoWeekdayOf(s.originDate)) && s.originDate >= dto.startsOn;
                const keep = future.filter((s) => s.status === 'SCHEDULED' && matches(s));
                const drop = future.filter((s) => s.status === 'SCHEDULED' && !matches(s));
                const reopen = future.filter(
                    (s) => s.status === 'CANCELLED' && s.cancelReason === 'SCHEDULE_REMOVED' && matches(s),
                );

                await this.assertCapacityFits(
                    tx,
                    dto.capacity,
                    [...keep, ...reopen].map((s) => s.id),
                );

                const newVersion = series.version + 1;
                await tx
                    .update(classSeriesInApp)
                    .set({
                        ...this.seriesColumns(dto),
                        version: newVersion,
                        updatedByUserId: actorUserId,
                        updatedAt: nowIso,
                    })
                    .where(eq(classSeriesInApp.id, id));
                await tx.delete(classSeriesWeekdaysInApp).where(eq(classSeriesWeekdaysInApp.classSeriesId, id));
                await tx
                    .insert(classSeriesWeekdaysInApp)
                    .values(dto.weekdays.map((isoWeekday) => ({ classSeriesId: id, isoWeekday })));

                const snapshotSource = this.seriesColumns(dto);
                for (const session of [...keep, ...reopen]) {
                    await this.syncSessionSnapshot(tx, session, snapshotSource, newVersion, actorUserId, nowIso, {
                        reopen: session.status === 'CANCELLED',
                    });
                }

                const cancelled = await this.cancelSessions(tx, drop, 'SCHEDULE_REMOVED', actorUserId, nowIso);
                const materialized = await this.materializer.materializeSeriesInTx(tx, id, 'update', actorUserId);

                await tx.insert(classScheduleEventsInApp).values({
                    classSeriesId: id,
                    eventType: 'UPDATED',
                    actorUserId,
                    beforeState: series,
                    afterState: { ...this.seriesColumns(dto), version: newVersion },
                    occurredAt: nowIso,
                });

                return {
                    classSeries: await this.dtoInTx(tx, id),
                    impact: {
                        affectedSessions: keep.length + reopen.length + drop.length + materialized,
                        affectedReservations,
                        cancelledReservations: cancelled,
                    },
                };
            }),
        );
    }

    async setStatus(
        id: string,
        dto: SetClassStatusDto,
        actorUserId: string,
        ifMatch?: string,
    ): Promise<ClassMutationResult> {
        return await this.mapTrainerConflict(
            this.drizzle.db.transaction(async (tx) => {
                const series = await this.lockSeries(tx, id);
                if (series.status === 'ARCHIVED') {
                    throw new DomainHttpException(409, 'CLASS_ARCHIVED', 'La clase está archivada.', { classId: id });
                }
                assertVersion(ifMatch, series.version);

                if (series.status === dto.status) {
                    // Retry idempotente: sin cambios ni cascadas.
                    return { classSeries: await this.dtoInTx(tx, id), impact: ZERO_IMPACT };
                }

                const nowIso = this.clock.now().toISO()!;
                const future = await this.lockFutureSessions(tx, id);
                const affectedReservations = await this.countActiveReservations(
                    tx,
                    future.map((s) => s.id),
                );
                const newVersion = series.version + 1;
                const scheduledCount = future.filter((s) => s.status === 'SCHEDULED').length;
                let cancelled = 0;
                let reopened = 0;
                let materialized = 0;

                if (dto.status === 'INACTIVE') {
                    // Desactivar cancela TODAS las futuras programadas, incluso movidas.
                    cancelled = await this.cancelSessions(
                        tx,
                        future.filter((s) => s.status === 'SCHEDULED'),
                        'SERIES_INACTIVE',
                        actorUserId,
                        nowIso,
                    );
                } else {
                    // Reactivar reabre solo lo cancelado por SERIES_INACTIVE que siga
                    // en la recurrencia; MANUAL nunca se revive.
                    const weekdays = await this.weekdaysFor([id]);
                    const wanted = new Set(weekdays.get(id) ?? []);
                    const reopenable = future.filter(
                        (s) =>
                            s.status === 'CANCELLED' &&
                            s.cancelReason === 'SERIES_INACTIVE' &&
                            wanted.has(isoWeekdayOf(s.originDate)) &&
                            s.originDate >= series.startsOn,
                    );
                    for (const session of reopenable) {
                        await this.syncSessionSnapshot(tx, session, series, newVersion, actorUserId, nowIso, {
                            reopen: true,
                        });
                    }
                    reopened = reopenable.length;
                    materialized = await this.setSeriesStatusAndMaterialize(tx, id, newVersion, actorUserId, nowIso);
                }

                await tx
                    .update(classSeriesInApp)
                    .set({ status: dto.status, version: newVersion, updatedByUserId: actorUserId, updatedAt: nowIso })
                    .where(eq(classSeriesInApp.id, id));

                await tx.insert(classScheduleEventsInApp).values({
                    classSeriesId: id,
                    eventType: 'STATUS_CHANGED',
                    actorUserId,
                    beforeState: { status: series.status },
                    afterState: { status: dto.status },
                    occurredAt: nowIso,
                });

                return {
                    classSeries: await this.dtoInTx(tx, id),
                    impact: {
                        affectedSessions: dto.status === 'INACTIVE' ? scheduledCount : reopened + materialized,
                        affectedReservations,
                        cancelledReservations: cancelled,
                    },
                };
            }),
        );
    }

    async archive(id: string, actorUserId: string, ifMatch?: string): Promise<ClassMutationResult> {
        return await this.drizzle.db.transaction(async (tx) => {
            const series = await this.lockSeries(tx, id);
            if (series.status === 'ARCHIVED') {
                // Transición terminal ya confirmada: retry sin cambios.
                return { classSeries: await this.dtoInTx(tx, id), impact: ZERO_IMPACT };
            }
            assertVersion(ifMatch, series.version);

            const nowIso = this.clock.now().toISO()!;
            const future = await this.lockFutureSessions(tx, id);
            const scheduled = future.filter((s) => s.status === 'SCHEDULED');
            const affectedReservations = await this.countActiveReservations(
                tx,
                future.map((s) => s.id),
            );
            const cancelled = await this.cancelSessions(tx, scheduled, 'SERIES_ARCHIVED', actorUserId, nowIso);

            await tx
                .update(classSeriesInApp)
                .set({
                    status: 'ARCHIVED',
                    deletedAt: nowIso,
                    version: series.version + 1,
                    updatedByUserId: actorUserId,
                    updatedAt: nowIso,
                })
                .where(eq(classSeriesInApp.id, id));

            await tx.insert(classScheduleEventsInApp).values({
                classSeriesId: id,
                eventType: 'ARCHIVED',
                actorUserId,
                beforeState: { status: series.status },
                afterState: { status: 'ARCHIVED' },
                occurredAt: nowIso,
            });

            return {
                classSeries: await this.dtoInTx(tx, id),
                impact: {
                    affectedSessions: scheduled.length,
                    affectedReservations,
                    cancelledReservations: cancelled,
                },
            };
        });
    }

    /** Columnas de escritura comunes de la serie a partir del DTO. */
    private seriesColumns(dto: UpdateClassDto) {
        return {
            name: dto.name,
            description: dto.description,
            trainerId: dto.trainerId,
            localStartTime: dto.localStartTime,
            durationMinutes: dto.durationMinutes,
            capacity: dto.capacity,
            allowWaitlist: dto.allowWaitlist,
            startsOn: dto.startsOn,
            category: dto.category ?? null,
            level: dto.level ?? null,
            room: dto.room ?? null,
            zone: dto.zone ?? null,
        };
    }

    private async lockSeries(tx: DbTx, id: string): Promise<ClassSeries> {
        const [series] = await tx.select().from(classSeriesInApp).where(eq(classSeriesInApp.id, id)).for('update');
        if (!series) throw new DomainHttpException(404, 'CLASS_NOT_FOUND', 'La clase no existe.', { classId: id });
        return series;
    }

    /** Bloquea las sesiones futuras de la serie en orden estable (anti-deadlock). */
    private async lockFutureSessions(tx: DbTx, seriesId: string): Promise<ClassSessionRow[]> {
        return await tx
            .select()
            .from(classSessionsInApp)
            .where(
                and(
                    eq(classSessionsInApp.classSeriesId, seriesId),
                    gt(classSessionsInApp.startsAt, this.clock.now().toISO()!),
                ),
            )
            .orderBy(asc(classSessionsInApp.id))
            .for('update');
    }

    private async assertTrainerActive(tx: DbTx, trainerId: string): Promise<void> {
        const [trainer] = await tx
            .select({ id: trainersInApp.id })
            .from(trainersInApp)
            .innerJoin(usersInApp, eq(trainersInApp.userId, usersInApp.id))
            .where(
                and(
                    eq(trainersInApp.id, trainerId),
                    eq(trainersInApp.status, 'ACTIVE'),
                    eq(usersInApp.status, 'ACTIVE'),
                ),
            );
        if (!trainer) {
            throw new DomainHttpException(404, 'TRAINER_NOT_FOUND', 'El entrenador no existe o no está activo.', {
                trainerId,
            });
        }
    }

    /** Rechaza bajar capacidad por debajo de la ocupación de alguna sesión futura. */
    private async assertCapacityFits(tx: DbTx, capacity: number, sessionIds: string[]): Promise<void> {
        if (sessionIds.length === 0) return;
        const rows = await tx
            .select({ sessionId: reservationsInApp.sessionId, booked: count() })
            .from(reservationsInApp)
            .where(
                and(
                    inArray(reservationsInApp.sessionId, sessionIds),
                    inArray(reservationsInApp.status, [...OCCUPYING]),
                ),
            )
            .groupBy(reservationsInApp.sessionId);
        const over = rows.find((r) => Number(r.booked) > capacity);
        if (over) {
            throw new DomainHttpException(
                409,
                'CAPACITY_BELOW_OCCUPANCY',
                'Una sesión futura quedaría con más reservas que la capacidad.',
                { sessionId: over.sessionId, booked: Number(over.booked), capacity },
            );
        }
    }

    private async countActiveReservations(tx: DbTx, sessionIds: string[]): Promise<number> {
        if (sessionIds.length === 0) return 0;
        const [row] = await tx
            .select({ total: count() })
            .from(reservationsInApp)
            .where(and(inArray(reservationsInApp.sessionId, sessionIds), eq(reservationsInApp.status, 'CONFIRMED')));
        return Number(row?.total ?? 0);
    }

    /**
     * Sincroniza el snapshot de una sesión futura con la serie (nombre,
     * entrenador, capacidad, metadata). El horario solo se toca si NO fue
     * movida a mano; `reopen` además la devuelve a SCHEDULED.
     */
    private async syncSessionSnapshot(
        tx: DbTx,
        session: ClassSessionRow,
        source: Pick<
            ClassSeries,
            | 'name'
            | 'description'
            | 'trainerId'
            | 'capacity'
            | 'allowWaitlist'
            | 'category'
            | 'level'
            | 'room'
            | 'zone'
            | 'localStartTime'
            | 'durationMinutes'
        >,
        sourceSeriesVersion: number,
        actorUserId: string,
        nowIso: string,
        opts: { reopen: boolean },
    ): Promise<void> {
        const schedule = session.scheduleOverridden
            ? {}
            : (() => {
                  const startsAt = this.clock.fromLocal(session.originDate, source.localStartTime);
                  return {
                      startsAt: startsAt.toISO()!,
                      endsAt: startsAt.plus({ minutes: source.durationMinutes }).toISO()!,
                  };
              })();

        await tx
            .update(classSessionsInApp)
            .set({
                className: source.name,
                description: source.description,
                trainerId: source.trainerId,
                capacity: source.capacity,
                allowWaitlist: source.allowWaitlist,
                category: source.category,
                level: source.level,
                room: source.room,
                zone: source.zone,
                ...schedule,
                ...(opts.reopen
                    ? { status: 'SCHEDULED' as const, cancelReason: null, cancelledAt: null, cancelledByUserId: null }
                    : {}),
                sourceSeriesVersion,
                version: session.version + 1,
                updatedByUserId: actorUserId,
                updatedAt: nowIso,
            })
            .where(eq(classSessionsInApp.id, session.id));

        await tx.insert(classScheduleEventsInApp).values({
            classSessionId: session.id,
            eventType: 'RECONCILED',
            actorUserId,
            afterState: { reopen: opts.reopen, scheduleOverridden: session.scheduleOverridden },
            occurredAt: nowIso,
        });
    }

    /**
     * Cancela sesiones (con razón de sesión) y sus reservas CONFIRMED (razón
     * SERIES_CHANGED), con eventos por sesión y por reserva. Devuelve cuántas
     * reservas se cancelaron.
     */
    private async cancelSessions(
        tx: DbTx,
        sessions: ClassSessionRow[],
        reason: 'SCHEDULE_REMOVED' | 'SERIES_INACTIVE' | 'SERIES_ARCHIVED',
        actorUserId: string,
        nowIso: string,
    ): Promise<number> {
        if (sessions.length === 0) return 0;
        const ids = sessions.map((s) => s.id);

        await tx
            .update(classSessionsInApp)
            .set({
                status: 'CANCELLED',
                cancelReason: reason,
                cancelledAt: nowIso,
                cancelledByUserId: actorUserId,
                updatedByUserId: actorUserId,
                updatedAt: nowIso,
            })
            .where(inArray(classSessionsInApp.id, ids));

        await tx.insert(classScheduleEventsInApp).values(
            sessions.map((s) => ({
                classSessionId: s.id,
                eventType: 'CANCELLED',
                actorUserId,
                beforeState: { status: s.status },
                afterState: { status: 'CANCELLED', cancelReason: reason },
                occurredAt: nowIso,
            })),
        );

        const cancelledReservations = await tx
            .update(reservationsInApp)
            .set({
                status: 'CANCELLED',
                statusReason: 'SERIES_CHANGED',
                cancelledAt: nowIso,
                updatedByUserId: actorUserId,
                updatedAt: nowIso,
            })
            .where(and(inArray(reservationsInApp.sessionId, ids), eq(reservationsInApp.status, 'CONFIRMED')))
            .returning({ id: reservationsInApp.id, sessionId: reservationsInApp.sessionId });

        if (cancelledReservations.length > 0) {
            await tx.insert(reservationEventsInApp).values(
                cancelledReservations.map((r) => ({
                    reservationId: r.id,
                    actorUserId,
                    fromStatus: 'CONFIRMED' as const,
                    toStatus: 'CANCELLED' as const,
                    reason: 'SERIES_CHANGED' as const,
                    fromSessionId: r.sessionId,
                    occurredAt: nowIso,
                })),
            );
        }
        return cancelledReservations.length;
    }

    /** La serie debe estar ACTIVE antes de materializar en la reactivación. */
    private async setSeriesStatusAndMaterialize(
        tx: DbTx,
        id: string,
        version: number,
        actorUserId: string,
        nowIso: string,
    ): Promise<number> {
        await tx
            .update(classSeriesInApp)
            .set({ status: 'ACTIVE', version, updatedByUserId: actorUserId, updatedAt: nowIso })
            .where(eq(classSeriesInApp.id, id));
        return await this.materializer.materializeSeriesInTx(tx, id, 'activate', actorUserId);
    }

    private async weekdaysFor(seriesIds: string[]): Promise<Map<string, number[]>> {
        const map = new Map<string, number[]>();
        if (seriesIds.length === 0) return map;
        const rows = await this.drizzle.db
            .select()
            .from(classSeriesWeekdaysInApp)
            .where(inArray(classSeriesWeekdaysInApp.classSeriesId, seriesIds))
            .orderBy(asc(classSeriesWeekdaysInApp.isoWeekday));
        for (const row of rows) {
            map.set(row.classSeriesId, [...(map.get(row.classSeriesId) ?? []), row.isoWeekday]);
        }
        return map;
    }

    /** Relee el DTO dentro de la transacción del comando (estado confirmado). */
    private async dtoInTx(tx: DbTx, id: string): Promise<ClassSeriesDto> {
        const [row] = await tx
            .select({ series: classSeriesInApp, trainerName: usersInApp.fullName })
            .from(classSeriesInApp)
            .innerJoin(trainersInApp, eq(classSeriesInApp.trainerId, trainersInApp.id))
            .innerJoin(usersInApp, eq(trainersInApp.userId, usersInApp.id))
            .where(eq(classSeriesInApp.id, id));
        const weekdayRows = await tx
            .select({ isoWeekday: classSeriesWeekdaysInApp.isoWeekday })
            .from(classSeriesWeekdaysInApp)
            .where(eq(classSeriesWeekdaysInApp.classSeriesId, id))
            .orderBy(asc(classSeriesWeekdaysInApp.isoWeekday));
        return this.toDto(
            row!.series,
            weekdayRows.map((r) => r.isoWeekday),
            row!.trainerName,
        );
    }

    private toDto(series: ClassSeries, weekdays: number[], trainerName: string): ClassSeriesDto {
        return {
            id: series.id,
            name: series.name,
            description: series.description,
            trainerId: series.trainerId,
            trainerName,
            weekdays,
            localStartTime: series.localStartTime.slice(0, 5),
            durationMinutes: series.durationMinutes,
            capacity: series.capacity,
            allowWaitlist: series.allowWaitlist,
            startsOn: series.startsOn,
            category: series.category,
            level: series.level,
            room: series.room,
            zone: series.zone,
            status: series.status,
            version: series.version,
            createdAt: series.createdAt,
            updatedAt: series.updatedAt,
        };
    }

    /** Traduce la exclusión GiST (23P01) al error estable del contrato. */
    private async mapTrainerConflict<T>(work: Promise<T>): Promise<T> {
        try {
            return await work;
        } catch (error) {
            if (pgErrorCode(error) === '23P01') {
                throw new DomainHttpException(
                    409,
                    'TRAINER_TIME_CONFLICT',
                    'El entrenador ya imparte otra sesión en ese horario.',
                );
            }
            throw error;
        }
    }
}
