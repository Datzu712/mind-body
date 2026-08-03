import { Injectable } from '@nestjs/common';
import { and, asc, count, eq, gt, gte, inArray, lt } from 'drizzle-orm';

import { DrizzleService } from '@/infra/database/pg/drizzle.service';
import {
    classScheduleEventsInApp,
    classSessionsInApp,
    membersInApp,
    reservationEventsInApp,
    reservationsInApp,
    trainersInApp,
    usersInApp,
    type ClassSessionRow,
} from '@/infra/database/pg/schemas/schema';
import { pgErrorCode } from '@/infra/database/pg/pg-error';
import type { DbTx } from '@/infra/database/pg/drizzle.types';
import { ClockService } from '@/common/clock/clock.service';
import { DomainHttpException } from '@/common/domain/domain-http.exception';
import { assertVersion } from '@/common/domain/assert-version';
import { requireTrainerId, type Actor } from '@/common/auth/actor';
import type { ListSessionsQueryDto, MoveSessionDto } from './dto/session.dtos';
import type { SessionDto, SessionMutationResult, SessionViewer } from './session.types';

const OCCUPYING = ['CONFIRMED', 'ATTENDED', 'NO_SHOW'] as const;
const MAX_RANGE_DAYS = 31;

/** Queries y comandos de sesión (Task 6 del plan). */
@Injectable()
export class ClassSessionsService {
    constructor(
        private readonly drizzle: DrizzleService,
        private readonly clock: ClockService,
    ) {}

    async list(query: ListSessionsQueryDto, actor: Actor): Promise<SessionDto[]> {
        const fromInstant = this.clock.fromLocal(query.from, '00:00');
        const toInstant = this.clock.fromLocal(query.to, '00:00').plus({ days: 1 });
        if (toInstant <= fromInstant) {
            throw new DomainHttpException(400, 'SESSION_NOT_FOUND', 'Rango inválido: from debe ser <= to.');
        }
        if (toInstant.diff(fromInstant, 'days').days > MAX_RANGE_DAYS) {
            throw new DomainHttpException(400, 'SESSION_NOT_FOUND', `El rango máximo es ${MAX_RANGE_DAYS} días.`);
        }

        const conditions = [
            gte(classSessionsInApp.startsAt, fromInstant.toISO()!),
            lt(classSessionsInApp.startsAt, toInstant.toISO()!),
        ];
        if (!query.includeCancelled) conditions.push(eq(classSessionsInApp.status, 'SCHEDULED'));
        if (query.classId) conditions.push(eq(classSessionsInApp.classSeriesId, query.classId));
        if (query.trainerId) conditions.push(eq(classSessionsInApp.trainerId, query.trainerId));
        // Filtro explícito, no permiso: el catálogo completo lo puede leer cualquier
        // rol autenticado (es la agenda del gimnasio que mobile ya muestra).
        if (query.mine) {
            const trainerId = await requireTrainerId(this.drizzle.db, actor.userId);
            conditions.push(eq(classSessionsInApp.trainerId, trainerId));
        }

        const rows = await this.drizzle.db
            .select({ session: classSessionsInApp, trainerName: usersInApp.fullName })
            .from(classSessionsInApp)
            .innerJoin(trainersInApp, eq(classSessionsInApp.trainerId, trainersInApp.id))
            .innerJoin(usersInApp, eq(trainersInApp.userId, usersInApp.id))
            .where(and(...conditions))
            .orderBy(asc(classSessionsInApp.startsAt), asc(classSessionsInApp.id));

        const sessionIds = rows.map((r) => r.session.id);
        const booked = await this.bookedBySession(this.drizzle.db, sessionIds);
        const viewers = await this.viewersFor(sessionIds, actor.userId);

        return rows.map((r) =>
            this.toDto(r.session, r.trainerName, booked.get(r.session.id) ?? 0, viewers?.get(r.session.id) ?? null),
        );
    }

    async detail(id: string, actor: Actor): Promise<SessionDto> {
        const [row] = await this.drizzle.db
            .select({ session: classSessionsInApp, trainerName: usersInApp.fullName })
            .from(classSessionsInApp)
            .innerJoin(trainersInApp, eq(classSessionsInApp.trainerId, trainersInApp.id))
            .innerJoin(usersInApp, eq(trainersInApp.userId, usersInApp.id))
            .where(eq(classSessionsInApp.id, id));
        if (!row) throw new DomainHttpException(404, 'SESSION_NOT_FOUND', 'La sesión no existe.', { sessionId: id });

        const booked = await this.bookedBySession(this.drizzle.db, [id]);
        const viewers = await this.viewersFor([id], actor.userId);
        return this.toDto(row.session, row.trainerName, booked.get(id) ?? 0, viewers?.get(id) ?? null);
    }

    /** Mueve UNA sesión futura conservando duración y reservas; marca override. */
    async move(id: string, dto: MoveSessionDto, actorUserId: string, ifMatch?: string): Promise<SessionMutationResult> {
        try {
            return await this.drizzle.db.transaction(async (tx) => {
                const session = await this.lockSession(tx, id);
                this.assertMutableFuture(session);
                assertVersion(ifMatch, session.version);

                const now = this.clock.now();
                const newStartsAt = this.clock.fromLocal(dto.date, dto.startTime);
                if (newStartsAt <= now) {
                    throw new DomainHttpException(
                        409,
                        'SESSION_ALREADY_STARTED',
                        'La nueva fecha/hora debe ser futura.',
                    );
                }

                const currentLocal = this.clock.toLocal(session.startsAt);
                const unchanged =
                    currentLocal.toISODate() === dto.date && currentLocal.toFormat('HH:mm') === dto.startTime;
                const affectedReservations = await this.countConfirmed(tx, id);
                if (unchanged) {
                    return {
                        session: await this.dtoInTx(tx, id),
                        impact: { affectedSessions: 0, affectedReservations, cancelledReservations: 0 },
                        changed: false,
                    };
                }

                const durationMs = this.clock.toLocal(session.endsAt).toMillis() - currentLocal.toMillis();
                const nowIso = now.toISO()!;

                await tx
                    .update(classSessionsInApp)
                    .set({
                        startsAt: newStartsAt.toISO()!,
                        endsAt: newStartsAt.plus({ milliseconds: durationMs }).toISO()!,
                        scheduleOverridden: true,
                        version: session.version + 1,
                        updatedByUserId: actorUserId,
                        updatedAt: nowIso,
                    })
                    .where(eq(classSessionsInApp.id, id));

                await tx.insert(classScheduleEventsInApp).values({
                    classSessionId: id,
                    eventType: 'MOVED',
                    actorUserId,
                    beforeState: { startsAt: session.startsAt, endsAt: session.endsAt },
                    afterState: { startsAt: newStartsAt.toISO(), scheduleOverridden: true },
                    occurredAt: nowIso,
                });

                return {
                    session: await this.dtoInTx(tx, id),
                    impact: { affectedSessions: 1, affectedReservations, cancelledReservations: 0 },
                    changed: true,
                };
            });
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

    /** Cancelación manual idempotente: cancela también sus reservas CONFIRMED. */
    async cancel(id: string, actorUserId: string, ifMatch?: string): Promise<SessionMutationResult> {
        return await this.drizzle.db.transaction(async (tx) => {
            const session = await this.lockSession(tx, id);
            if (session.status === 'CANCELLED') {
                return {
                    session: await this.dtoInTx(tx, id),
                    impact: { affectedSessions: 0, affectedReservations: 0, cancelledReservations: 0 },
                    changed: false,
                };
            }
            this.assertMutableFuture(session);
            assertVersion(ifMatch, session.version);

            const nowIso = this.clock.now().toISO()!;
            const affectedReservations = await this.countConfirmed(tx, id);

            await tx
                .update(classSessionsInApp)
                .set({
                    status: 'CANCELLED',
                    cancelReason: 'MANUAL',
                    cancelledAt: nowIso,
                    cancelledByUserId: actorUserId,
                    version: session.version + 1,
                    updatedByUserId: actorUserId,
                    updatedAt: nowIso,
                })
                .where(eq(classSessionsInApp.id, id));

            const cancelled = await tx
                .update(reservationsInApp)
                .set({
                    status: 'CANCELLED',
                    statusReason: 'SESSION_CANCELLED',
                    cancelledAt: nowIso,
                    updatedByUserId: actorUserId,
                    updatedAt: nowIso,
                })
                .where(and(eq(reservationsInApp.sessionId, id), eq(reservationsInApp.status, 'CONFIRMED')))
                .returning({ id: reservationsInApp.id });

            if (cancelled.length > 0) {
                await tx.insert(reservationEventsInApp).values(
                    cancelled.map((r) => ({
                        reservationId: r.id,
                        actorUserId,
                        fromStatus: 'CONFIRMED' as const,
                        toStatus: 'CANCELLED' as const,
                        reason: 'SESSION_CANCELLED' as const,
                        fromSessionId: id,
                        occurredAt: nowIso,
                    })),
                );
            }

            await tx.insert(classScheduleEventsInApp).values({
                classSessionId: id,
                eventType: 'CANCELLED',
                actorUserId,
                beforeState: { status: 'SCHEDULED' },
                afterState: { status: 'CANCELLED', cancelReason: 'MANUAL' },
                occurredAt: nowIso,
            });

            return {
                session: await this.dtoInTx(tx, id),
                impact: { affectedSessions: 1, affectedReservations, cancelledReservations: cancelled.length },
                changed: true,
            };
        });
    }

    // ── Helpers ─────────────────────────────────────────────────────────────

    private async lockSession(tx: DbTx, id: string): Promise<ClassSessionRow> {
        const [session] = await tx.select().from(classSessionsInApp).where(eq(classSessionsInApp.id, id)).for('update');
        if (!session)
            throw new DomainHttpException(404, 'SESSION_NOT_FOUND', 'La sesión no existe.', { sessionId: id });
        return session;
    }

    private assertMutableFuture(session: ClassSessionRow): void {
        if (session.status === 'CANCELLED') {
            throw new DomainHttpException(409, 'SESSION_CANCELLED', 'La sesión está cancelada.', {
                sessionId: session.id,
            });
        }
        if (this.clock.toLocal(session.startsAt) <= this.clock.nowLocal()) {
            throw new DomainHttpException(409, 'SESSION_ALREADY_STARTED', 'La sesión ya inició.', {
                sessionId: session.id,
            });
        }
    }

    private async countConfirmed(tx: DbTx, sessionId: string): Promise<number> {
        const [row] = await tx
            .select({ total: count() })
            .from(reservationsInApp)
            .where(and(eq(reservationsInApp.sessionId, sessionId), eq(reservationsInApp.status, 'CONFIRMED')));
        return Number(row?.total ?? 0);
    }

    private async bookedBySession(db: DbTx | DrizzleService['db'], sessionIds: string[]): Promise<Map<string, number>> {
        const map = new Map<string, number>();
        if (sessionIds.length === 0) return map;
        const rows = await db
            .select({ sessionId: reservationsInApp.sessionId, total: count() })
            .from(reservationsInApp)
            .where(
                and(
                    inArray(reservationsInApp.sessionId, sessionIds),
                    inArray(reservationsInApp.status, [...OCCUPYING]),
                ),
            )
            .groupBy(reservationsInApp.sessionId);
        for (const row of rows) map.set(row.sessionId, Number(row.total));
        return map;
    }

    /**
     * Proyección `viewer` para el usuario autenticado con perfil de miembro:
     * su reserva vigente por sesión y si tiene choque de horario con otra
     * reserva CONFIRMED. Sin perfil de miembro devuelve null (admin/staff).
     */
    private async viewersFor(sessionIds: string[], viewerUserId: string): Promise<Map<string, SessionViewer> | null> {
        if (sessionIds.length === 0) return new Map();
        const [member] = await this.drizzle.db
            .select({ id: membersInApp.id })
            .from(membersInApp)
            .where(eq(membersInApp.userId, viewerUserId));
        if (!member) return null;

        const own = await this.drizzle.db
            .select()
            .from(reservationsInApp)
            .where(
                and(
                    inArray(reservationsInApp.sessionId, sessionIds),
                    eq(reservationsInApp.memberId, member.id),
                    inArray(reservationsInApp.status, [...OCCUPYING]),
                ),
            );
        const ownBySession = new Map(own.map((r) => [r.sessionId, r]));

        // Choques: reservas CONFIRMED del miembro en otras sesiones futuras programadas.
        const confirmedSessions = await this.drizzle.db
            .select({
                sessionId: classSessionsInApp.id,
                startsAt: classSessionsInApp.startsAt,
                endsAt: classSessionsInApp.endsAt,
            })
            .from(reservationsInApp)
            .innerJoin(classSessionsInApp, eq(reservationsInApp.sessionId, classSessionsInApp.id))
            .where(
                and(
                    eq(reservationsInApp.memberId, member.id),
                    eq(reservationsInApp.status, 'CONFIRMED'),
                    eq(classSessionsInApp.status, 'SCHEDULED'),
                    gt(classSessionsInApp.startsAt, this.clock.now().toISO()!),
                ),
            );

        const targets = await this.drizzle.db
            .select({
                id: classSessionsInApp.id,
                startsAt: classSessionsInApp.startsAt,
                endsAt: classSessionsInApp.endsAt,
            })
            .from(classSessionsInApp)
            .where(inArray(classSessionsInApp.id, sessionIds));

        const map = new Map<string, SessionViewer>();
        for (const target of targets) {
            const mine = ownBySession.get(target.id);
            const hasConflict = confirmedSessions.some(
                (other) =>
                    other.sessionId !== target.id && other.startsAt < target.endsAt && other.endsAt > target.startsAt,
            );
            map.set(target.id, {
                reservationId: mine?.id ?? null,
                reservationStatus: (mine?.status as SessionViewer['reservationStatus']) ?? null,
                hasConflict,
            });
        }
        return map;
    }

    private async dtoInTx(tx: DbTx, id: string): Promise<SessionDto> {
        const [row] = await tx
            .select({ session: classSessionsInApp, trainerName: usersInApp.fullName })
            .from(classSessionsInApp)
            .innerJoin(trainersInApp, eq(classSessionsInApp.trainerId, trainersInApp.id))
            .innerJoin(usersInApp, eq(trainersInApp.userId, usersInApp.id))
            .where(eq(classSessionsInApp.id, id));
        const booked = await this.bookedBySession(tx, [id]);
        return this.toDto(row!.session, row!.trainerName, booked.get(id) ?? 0, null);
    }

    private toDto(
        session: ClassSessionRow,
        trainerName: string,
        booked: number,
        viewer: SessionViewer | null,
    ): SessionDto {
        const startsLocal = this.clock.toLocal(session.startsAt);
        const endsLocal = this.clock.toLocal(session.endsAt);
        return {
            id: session.id,
            classId: session.classSeriesId,
            className: session.className,
            description: session.description,
            trainerId: session.trainerId,
            trainerName,
            originDate: session.originDate,
            // ISO 8601 (zona del negocio): el formato SQL crudo de Postgres no lo
            // parsea Hermes (React Native) con `new Date()`.
            startsAt: this.clock.toLocal(session.startsAt).toISO()!,
            endsAt: this.clock.toLocal(session.endsAt).toISO()!,
            timeZone: this.clock.timeZone,
            localDate: startsLocal.toISODate()!,
            startTime: startsLocal.toFormat('HH:mm'),
            endTime: endsLocal.toFormat('HH:mm'),
            capacity: session.capacity,
            booked,
            availableSpots: Math.max(session.capacity - booked, 0),
            allowWaitlist: session.allowWaitlist,
            status: session.status,
            scheduleOverridden: session.scheduleOverridden,
            category: session.category,
            level: session.level,
            room: session.room,
            zone: session.zone,
            version: session.version,
            viewer,
        };
    }
}
