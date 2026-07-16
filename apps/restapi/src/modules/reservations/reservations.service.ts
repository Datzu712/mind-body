import { BadRequestException, Injectable } from '@nestjs/common';
import { and, asc, desc, eq, gt, inArray, ne } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';

import { DrizzleService } from '@/infra/database/pg/drizzle.service';
import {
    classSessionsInApp,
    membersInApp,
    reservationEventsInApp,
    reservationsInApp,
    trainersInApp,
    usersInApp,
    type ClassSessionRow,
    type ReservationRow,
} from '@/infra/database/pg/schemas/schema';
import { pgErrorCode } from '@/infra/database/pg/pg-error';
import type { DbTx } from '@/infra/database/pg/drizzle.types';
import { ClockService } from '@/common/clock/clock.service';
import { DomainHttpException } from '@/common/domain/domain-http.exception';
import type { SessionDto } from '@/modules/class-sessions/session.types';
import type {
    AdminCancelReservationDto,
    ListMyReservationsQueryDto,
    MarkAttendanceDto,
    RescheduleReservationDto,
} from './dto/reservation.dtos';
import type {
    CancelReservationResult,
    DomainWarning,
    ReservationDto,
    ReservationMutationResult,
    SessionMemberEntryDto,
} from './reservation.types';

const OCCUPYING = ['CONFIRMED', 'ATTENDED', 'NO_SHOW'] as const;
const LATE_WINDOW_HOURS = 12;

/**
 * Reservas self-scoped, cancelación con regla de 12 h, reprogramación atómica
 * enlazada y asistencia (Tasks 7-8 del plan). Regla global: toda transición
 * que cambia ocupación bloquea primero la fila class_sessions.
 */
@Injectable()
export class ReservationsService {
    constructor(
        private readonly drizzle: DrizzleService,
        private readonly clock: ClockService,
    ) {}

    /** POST /class-sessions/:id/reservations — sin body; miembro del token. */
    async book(
        sessionId: string,
        viewerUserId: string,
    ): Promise<{ result: ReservationMutationResult; created: boolean }> {
        try {
            return await this.drizzle.db.transaction(async (tx) => {
                const session = await this.lockSession(tx, sessionId);
                this.assertBookableSession(session);
                const memberId = await this.resolveEligibleMember(tx, viewerUserId, session);

                // Duplicado vigente: un retry idéntico devuelve la fila existente.
                const [existing] = await tx
                    .select()
                    .from(reservationsInApp)
                    .where(
                        and(
                            eq(reservationsInApp.sessionId, sessionId),
                            eq(reservationsInApp.memberId, memberId),
                            ne(reservationsInApp.status, 'CANCELLED'),
                        ),
                    );
                if (existing) {
                    if (existing.status === 'CONFIRMED') {
                        return {
                            result: {
                                reservation: await this.dtoFor(tx, existing),
                                changed: false,
                                warnings: await this.conflictWarnings(tx, memberId, session),
                            },
                            created: false,
                        };
                    }
                    throw new DomainHttpException(
                        409,
                        'ALREADY_RESERVED',
                        'Ya existe una reserva vigente en esta sesión.',
                        { reservationId: existing.id, status: existing.status },
                    );
                }

                const booked = await this.countOccupying(tx, sessionId);
                if (booked >= session.capacity) {
                    throw new DomainHttpException(409, 'SESSION_FULL', 'La sesión no tiene cupos disponibles.', {
                        sessionId,
                    });
                }

                const nowIso = this.clock.now().toISO()!;
                const [reservation] = await tx
                    .insert(reservationsInApp)
                    .values({
                        sessionId,
                        memberId,
                        status: 'CONFIRMED',
                        statusReason: 'MEMBER_BOOKED',
                        confirmedAt: nowIso,
                        createdByUserId: viewerUserId,
                    })
                    .returning();

                await tx.insert(reservationEventsInApp).values({
                    reservationId: reservation!.id,
                    actorUserId: viewerUserId,
                    fromStatus: null,
                    toStatus: 'CONFIRMED',
                    reason: 'MEMBER_BOOKED',
                    toSessionId: sessionId,
                    occurredAt: nowIso,
                });

                return {
                    result: {
                        reservation: await this.dtoFor(tx, reservation!),
                        changed: true,
                        warnings: await this.conflictWarnings(tx, memberId, session),
                    },
                    created: true,
                };
            });
        } catch (error) {
            // Carrera de dos bookings idénticos: el perdedor del unique parcial
            // relee la fila ganadora y la devuelve como retry recuperado.
            if (pgErrorCode(error) === '23505') {
                const recovered = await this.recoverOwnBooking(sessionId, viewerUserId);
                if (recovered) return recovered;
            }
            throw error;
        }
    }

    async listMine(query: ListMyReservationsQueryDto, viewerUserId: string): Promise<ReservationDto[]> {
        const member = await this.memberOf(this.drizzle.db, viewerUserId);
        if (!member) {
            throw new DomainHttpException(409, 'MEMBER_PROFILE_REQUIRED', 'El usuario no tiene perfil de miembro.');
        }
        const nowIso = this.clock.now().toISO()!;
        const upcoming = query.scope === 'UPCOMING';

        const rows = await this.drizzle.db
            .select({ reservation: reservationsInApp, session: classSessionsInApp, trainerName: usersInApp.fullName })
            .from(reservationsInApp)
            .innerJoin(classSessionsInApp, eq(reservationsInApp.sessionId, classSessionsInApp.id))
            .innerJoin(trainersInApp, eq(classSessionsInApp.trainerId, trainersInApp.id))
            .innerJoin(usersInApp, eq(trainersInApp.userId, usersInApp.id))
            .where(
                and(
                    eq(reservationsInApp.memberId, member.id),
                    ...(upcoming
                        ? [eq(reservationsInApp.status, 'CONFIRMED' as const), gt(classSessionsInApp.startsAt, nowIso)]
                        : []),
                ),
            )
            .orderBy(upcoming ? asc(classSessionsInApp.startsAt) : desc(classSessionsInApp.startsAt));

        const nowLocal = this.clock.nowLocal();
        const filtered = upcoming
            ? rows
            : rows.filter(
                  (r) => !(r.reservation.status === 'CONFIRMED' && this.clock.toLocal(r.session.startsAt) > nowLocal),
              );
        return filtered.map((r) => this.toDto(r.reservation, r.session, r.trainerName));
    }

    /** Sesiones alternativas: misma serie, futuras, programadas, con cupo. */
    async rescheduleOptions(reservationId: string, viewerUserId: string): Promise<SessionDto[]> {
        const context = await this.loadReservation(this.drizzle.db, reservationId);
        await this.assertOwnerOrStaff(this.drizzle.db, context.reservation, viewerUserId);

        const nowIso = this.clock.now().toISO()!;
        const candidates = await this.drizzle.db
            .select({ session: classSessionsInApp, trainerName: usersInApp.fullName })
            .from(classSessionsInApp)
            .innerJoin(trainersInApp, eq(classSessionsInApp.trainerId, trainersInApp.id))
            .innerJoin(usersInApp, eq(trainersInApp.userId, usersInApp.id))
            .where(
                and(
                    eq(classSessionsInApp.classSeriesId, context.session.classSeriesId),
                    eq(classSessionsInApp.status, 'SCHEDULED'),
                    gt(classSessionsInApp.startsAt, nowIso),
                    ne(classSessionsInApp.id, context.session.id),
                ),
            )
            .orderBy(asc(classSessionsInApp.startsAt));

        const options: SessionDto[] = [];
        for (const candidate of candidates) {
            const booked = await this.countOccupying(this.drizzle.db, candidate.session.id);
            if (booked >= candidate.session.capacity) continue;
            const warnings = await this.conflictWarnings(
                this.drizzle.db,
                context.reservation.memberId,
                candidate.session,
                context.reservation.sessionId,
            );
            options.push(this.toSessionDto(candidate.session, candidate.trainerName, booked, warnings.length > 0));
        }
        return options;
    }

    /** Cancela origen (RESCHEDULED) y crea destino enlazado, todo atómico. */
    async reschedule(
        reservationId: string,
        dto: RescheduleReservationDto,
        viewerUserId: string,
    ): Promise<ReservationMutationResult> {
        return await this.drizzle.db.transaction(async (tx) => {
            const loaded = await this.loadReservation(tx, reservationId);
            if (dto.targetSessionId === loaded.reservation.sessionId) {
                throw new DomainHttpException(409, 'TARGET_SAME_SESSION', 'El destino es la misma sesión de origen.');
            }

            // Bloquear ambas sesiones en orden estable por UUID (anti-deadlock).
            const [firstId, secondId] = [loaded.reservation.sessionId, dto.targetSessionId].sort();
            const lockedFirst = await this.lockSession(tx, firstId!);
            const lockedSecond = await this.lockSession(tx, secondId!);
            const origin = lockedFirst.id === loaded.reservation.sessionId ? lockedFirst : lockedSecond;
            const target = lockedFirst.id === dto.targetSessionId ? lockedFirst : lockedSecond;

            const [reservation] = await tx
                .select()
                .from(reservationsInApp)
                .where(eq(reservationsInApp.id, reservationId))
                .for('update');
            const isOwner = await this.assertOwnerOrStaff(tx, reservation!, viewerUserId);

            // Retry idéntico: el origen ya fue reprogramado a este mismo target.
            if (reservation!.status === 'CANCELLED' && reservation!.statusReason === 'RESCHEDULED') {
                const [destination] = await tx
                    .select()
                    .from(reservationsInApp)
                    .where(eq(reservationsInApp.rescheduledFromReservationId, reservationId));
                if (destination && destination.sessionId === dto.targetSessionId) {
                    return { reservation: await this.dtoFor(tx, destination), changed: false, warnings: [] };
                }
                throw new DomainHttpException(
                    409,
                    'INVALID_RESERVATION_STATE',
                    'La reserva ya fue reprogramada a otra sesión.',
                    { reservationId },
                );
            }
            if (reservation!.status !== 'CONFIRMED') {
                throw new DomainHttpException(
                    409,
                    'INVALID_RESERVATION_STATE',
                    'Solo una reserva confirmada puede reprogramarse.',
                    { status: reservation!.status },
                );
            }

            if (target.classSeriesId !== origin.classSeriesId) {
                throw new DomainHttpException(409, 'TARGET_CLASS_MISMATCH', 'El destino pertenece a otra clase.');
            }
            this.assertBookableSession(target, 'TARGET');
            if (this.clock.toLocal(origin.startsAt) <= this.clock.nowLocal()) {
                throw new DomainHttpException(409, 'SESSION_ALREADY_STARTED', 'La sesión de origen ya inició.');
            }

            // Ventana tardía: el miembro no puede; admin/staff exige nota de override.
            if (this.withinLateWindow(origin)) {
                if (isOwner) {
                    throw new DomainHttpException(
                        409,
                        'LATE_CHANGE_WINDOW',
                        'No se puede reprogramar a menos de 12 horas del inicio.',
                    );
                }
                if (!dto.lateOverrideNote?.trim()) {
                    throw new DomainHttpException(
                        409,
                        'LATE_CHANGE_WINDOW',
                        'La reprogramación tardía exige lateOverrideNote.',
                    );
                }
            } else if (isOwner && dto.lateOverrideNote) {
                throw new BadRequestException('lateOverrideNote no se acepta para el propio miembro.');
            }

            await this.resolveEligibleMember(tx, null, target, reservation!.memberId);

            const [duplicate] = await tx
                .select({ id: reservationsInApp.id })
                .from(reservationsInApp)
                .where(
                    and(
                        eq(reservationsInApp.sessionId, target.id),
                        eq(reservationsInApp.memberId, reservation!.memberId),
                        ne(reservationsInApp.status, 'CANCELLED'),
                    ),
                );
            if (duplicate) {
                throw new DomainHttpException(
                    409,
                    'ALREADY_RESERVED',
                    'El miembro ya tiene reserva vigente en el destino.',
                );
            }

            const targetBooked = await this.countOccupying(tx, target.id);
            if (targetBooked >= target.capacity) {
                throw new DomainHttpException(409, 'TARGET_SESSION_FULL', 'La sesión destino no tiene cupos.', {
                    sessionId: target.id,
                });
            }

            const nowIso = this.clock.now().toISO()!;
            await tx
                .update(reservationsInApp)
                .set({
                    status: 'CANCELLED',
                    statusReason: 'RESCHEDULED',
                    cancelledAt: nowIso,
                    updatedByUserId: viewerUserId,
                    updatedAt: nowIso,
                })
                .where(eq(reservationsInApp.id, reservationId));

            const [destination] = await tx
                .insert(reservationsInApp)
                .values({
                    sessionId: target.id,
                    memberId: reservation!.memberId,
                    status: 'CONFIRMED',
                    statusReason: 'RESCHEDULED',
                    confirmedAt: nowIso,
                    rescheduledFromReservationId: reservationId,
                    createdByUserId: viewerUserId,
                })
                .returning();

            await tx.insert(reservationEventsInApp).values([
                {
                    reservationId,
                    actorUserId: viewerUserId,
                    fromStatus: 'CONFIRMED' as const,
                    toStatus: 'CANCELLED' as const,
                    reason: 'RESCHEDULED' as const,
                    fromSessionId: origin.id,
                    toSessionId: target.id,
                    metadata: dto.lateOverrideNote ? { lateOverrideNote: dto.lateOverrideNote } : {},
                    occurredAt: nowIso,
                },
                {
                    reservationId: destination!.id,
                    actorUserId: viewerUserId,
                    fromStatus: null,
                    toStatus: 'CONFIRMED' as const,
                    reason: 'RESCHEDULED' as const,
                    fromSessionId: origin.id,
                    toSessionId: target.id,
                    occurredAt: nowIso,
                },
            ]);

            return {
                reservation: await this.dtoFor(tx, destination!),
                changed: true,
                warnings: await this.conflictWarnings(tx, reservation!.memberId, target, origin.id),
            };
        });
    }

    async cancel(
        reservationId: string,
        dto: AdminCancelReservationDto | undefined,
        viewerUserId: string,
    ): Promise<CancelReservationResult> {
        return await this.drizzle.db.transaction(async (tx) => {
            const loaded = await this.loadReservation(tx, reservationId);
            await this.lockSession(tx, loaded.session.id);
            const [reservation] = await tx
                .select()
                .from(reservationsInApp)
                .where(eq(reservationsInApp.id, reservationId))
                .for('update');
            const isOwner = await this.assertOwnerOrStaff(tx, reservation!, viewerUserId);

            if (reservation!.status === 'CANCELLED' || reservation!.status === 'NO_SHOW') {
                // Idempotente: repetir la cancelación devuelve el estado actual.
                return {
                    reservation: await this.dtoFor(tx, reservation!),
                    changed: false,
                    registeredAsNoShow: reservation!.status === 'NO_SHOW',
                };
            }
            if (reservation!.status !== 'CONFIRMED') {
                throw new DomainHttpException(
                    409,
                    'INVALID_RESERVATION_STATE',
                    'Solo una reserva confirmada puede cancelarse.',
                    { status: reservation!.status },
                );
            }
            if (this.clock.toLocal(loaded.session.startsAt) <= this.clock.nowLocal()) {
                throw new DomainHttpException(
                    409,
                    'SESSION_ALREADY_STARTED',
                    'La sesión ya inició; corresponde marcar asistencia.',
                );
            }

            // Intención explícita: owner = reglas de miembro; admin debe declarar.
            let intent: 'MEMBER_RULES' | 'ADMIN_OVERRIDE';
            if (isOwner) {
                intent = 'MEMBER_RULES';
            } else {
                if (!dto?.reason) {
                    throw new BadRequestException('La cancelación administrativa exige body {reason, note?}.');
                }
                intent = dto.reason === 'ADMIN_OVERRIDE' ? 'ADMIN_OVERRIDE' : 'MEMBER_RULES';
            }

            const nowIso = this.clock.now().toISO()!;
            const late = this.withinLateWindow(loaded.session);
            const asNoShow = intent === 'MEMBER_RULES' && late;

            await tx
                .update(reservationsInApp)
                .set(
                    asNoShow
                        ? {
                              status: 'NO_SHOW',
                              statusReason: 'LATE_CANCELLATION',
                              cancelledAt: nowIso,
                              updatedByUserId: viewerUserId,
                              updatedAt: nowIso,
                          }
                        : {
                              status: 'CANCELLED',
                              statusReason: intent === 'ADMIN_OVERRIDE' ? 'ADMIN_CANCELLED' : 'MEMBER_CANCELLED',
                              cancelledAt: nowIso,
                              updatedByUserId: viewerUserId,
                              updatedAt: nowIso,
                          },
                )
                .where(eq(reservationsInApp.id, reservationId));

            await tx.insert(reservationEventsInApp).values({
                reservationId,
                actorUserId: viewerUserId,
                fromStatus: 'CONFIRMED',
                toStatus: asNoShow ? 'NO_SHOW' : 'CANCELLED',
                reason: asNoShow
                    ? 'LATE_CANCELLATION'
                    : intent === 'ADMIN_OVERRIDE'
                      ? 'ADMIN_CANCELLED'
                      : 'MEMBER_CANCELLED',
                fromSessionId: loaded.session.id,
                metadata: dto?.note ? { note: dto.note } : {},
                occurredAt: nowIso,
            });

            const [updated] = await tx.select().from(reservationsInApp).where(eq(reservationsInApp.id, reservationId));
            return { reservation: await this.dtoFor(tx, updated!), changed: true, registeredAsNoShow: asNoShow };
        });
    }

    async markAttendance(
        reservationId: string,
        dto: MarkAttendanceDto,
        actorUserId: string,
    ): Promise<ReservationMutationResult> {
        return await this.drizzle.db.transaction(async (tx) => {
            const loaded = await this.loadReservation(tx, reservationId);
            await this.lockSession(tx, loaded.session.id);
            const [reservation] = await tx
                .select()
                .from(reservationsInApp)
                .where(eq(reservationsInApp.id, reservationId))
                .for('update');

            if (loaded.session.status === 'CANCELLED') {
                throw new DomainHttpException(409, 'SESSION_CANCELLED', 'La sesión está cancelada.');
            }
            if (this.clock.toLocal(loaded.session.startsAt) > this.clock.nowLocal()) {
                throw new DomainHttpException(
                    409,
                    'SESSION_ALREADY_STARTED',
                    'La asistencia se marca después del inicio de la sesión.',
                );
            }

            const targetStatus = dto.attended ? 'ATTENDED' : 'NO_SHOW';
            if (reservation!.status === targetStatus) {
                return { reservation: await this.dtoFor(tx, reservation!), changed: false, warnings: [] };
            }
            // Permite marcar desde CONFIRMED y corregir ATTENDED <-> NO_SHOW.
            if (!(['CONFIRMED', 'ATTENDED', 'NO_SHOW'] as string[]).includes(reservation!.status)) {
                throw new DomainHttpException(409, 'INVALID_RESERVATION_STATE', 'La reserva no admite asistencia.', {
                    status: reservation!.status,
                });
            }

            const nowIso = this.clock.now().toISO()!;
            await tx
                .update(reservationsInApp)
                .set({
                    status: targetStatus,
                    statusReason: 'ATTENDANCE',
                    attendanceMarkedAt: nowIso,
                    updatedByUserId: actorUserId,
                    updatedAt: nowIso,
                })
                .where(eq(reservationsInApp.id, reservationId));

            await tx.insert(reservationEventsInApp).values({
                reservationId,
                actorUserId,
                fromStatus: reservation!.status,
                toStatus: targetStatus,
                reason: 'ATTENDANCE',
                fromSessionId: loaded.session.id,
                metadata: dto.note ? { note: dto.note } : {},
                occurredAt: nowIso,
            });

            const [updated] = await tx.select().from(reservationsInApp).where(eq(reservationsInApp.id, reservationId));
            return { reservation: await this.dtoFor(tx, updated!), changed: true, warnings: [] };
        });
    }

    /** Roster administrativo de una sesión: todas las reservas, incluida la historia cancelada. */
    async roster(sessionId: string): Promise<SessionMemberEntryDto[]> {
        const [sessionRow] = await this.drizzle.db
            .select({ session: classSessionsInApp, trainerName: usersInApp.fullName })
            .from(classSessionsInApp)
            .innerJoin(trainersInApp, eq(classSessionsInApp.trainerId, trainersInApp.id))
            .innerJoin(usersInApp, eq(trainersInApp.userId, usersInApp.id))
            .where(eq(classSessionsInApp.id, sessionId));
        if (!sessionRow) {
            throw new DomainHttpException(404, 'SESSION_NOT_FOUND', 'La sesión no existe.', { sessionId });
        }

        const memberUsers = alias(usersInApp, 'member_users');
        const rows = await this.drizzle.db
            .select({ reservation: reservationsInApp, memberId: membersInApp.id, memberName: memberUsers.fullName })
            .from(reservationsInApp)
            .innerJoin(membersInApp, eq(reservationsInApp.memberId, membersInApp.id))
            .innerJoin(memberUsers, eq(membersInApp.userId, memberUsers.id))
            .where(eq(reservationsInApp.sessionId, sessionId))
            .orderBy(asc(reservationsInApp.createdAt), asc(reservationsInApp.id));

        return rows.map((row) => ({
            reservation: {
                id: row.reservation.id,
                status: row.reservation.status as SessionMemberEntryDto['reservation']['status'],
                statusReason: row.reservation.statusReason as SessionMemberEntryDto['reservation']['statusReason'],
                session: {
                    id: sessionRow.session.id,
                    classId: sessionRow.session.classSeriesId,
                    className: sessionRow.session.className,
                    trainerId: sessionRow.session.trainerId,
                    trainerName: sessionRow.trainerName,
                    startsAt: sessionRow.session.startsAt,
                    endsAt: sessionRow.session.endsAt,
                    status: sessionRow.session.status,
                    room: sessionRow.session.room,
                    zone: sessionRow.session.zone,
                },
                rescheduledFromReservationId: row.reservation.rescheduledFromReservationId,
                confirmedAt: row.reservation.confirmedAt,
                cancelledAt: row.reservation.cancelledAt,
                attendanceMarkedAt: row.reservation.attendanceMarkedAt,
                createdAt: row.reservation.createdAt,
                updatedAt: row.reservation.updatedAt,
            },
            member: { id: row.memberId, name: row.memberName },
        }));
    }

    private async lockSession(tx: DbTx, id: string): Promise<ClassSessionRow> {
        const [session] = await tx.select().from(classSessionsInApp).where(eq(classSessionsInApp.id, id)).for('update');
        if (!session)
            throw new DomainHttpException(404, 'SESSION_NOT_FOUND', 'La sesión no existe.', { sessionId: id });
        return session;
    }

    private assertBookableSession(session: ClassSessionRow, flavor: 'ORIGIN' | 'TARGET' = 'ORIGIN'): void {
        if (session.status === 'CANCELLED') {
            throw new DomainHttpException(409, 'SESSION_CANCELLED', 'La sesión está cancelada.', {
                sessionId: session.id,
            });
        }
        if (this.clock.toLocal(session.startsAt) <= this.clock.nowLocal()) {
            throw new DomainHttpException(
                409,
                'SESSION_ALREADY_STARTED',
                flavor === 'TARGET' ? 'La sesión destino ya inició.' : 'La sesión ya inició.',
                { sessionId: session.id },
            );
        }
    }

    private withinLateWindow(session: ClassSessionRow): boolean {
        const hours = this.clock.toLocal(session.startsAt).diff(this.clock.nowLocal(), 'hours').hours;
        // Exactamente 12h todavía es cancelación a tiempo.
        return hours > 0 && hours < LATE_WINDOW_HOURS;
    }

    private async memberOf(db: DbTx | DrizzleService['db'], userId: string) {
        const [member] = await db.select().from(membersInApp).where(eq(membersInApp.userId, userId));
        return member;
    }

    /**
     * Elegibilidad (§5.2): user ACTIVE, member ACTIVE y membresía ACTIVE que
     * cubre la fecha local real de la sesión. Con `viewerUserId` resuelve el
     * miembro del token; con `memberId` (reprogramación) valida ese perfil.
     */
    private async resolveEligibleMember(
        tx: DbTx,
        viewerUserId: string | null,
        // Vuelve a usarse al reactivar el chequeo de membresía (fecha local de la sesión).
        _session: ClassSessionRow,
        memberId?: string,
    ): Promise<string> {
        const rows = await tx
            .select({ member: membersInApp, userStatus: usersInApp.status })
            .from(membersInApp)
            .innerJoin(usersInApp, eq(membersInApp.userId, usersInApp.id))
            .where(viewerUserId ? eq(membersInApp.userId, viewerUserId) : eq(membersInApp.id, memberId!));
        const row = rows[0];
        if (!row || row.member.status !== 'ACTIVE' || row.member.deletedAt || row.userStatus !== 'ACTIVE') {
            throw new DomainHttpException(
                409,
                'MEMBER_PROFILE_REQUIRED',
                'El usuario no tiene un perfil de miembro activo.',
            );
        }

        // TODO(membresías): el requisito de membresía activa queda DESACTIVADO
        // hasta que el flujo de membresías esté implementado de verdad.
        // Reactivar este bloque (y reponer los imports membershipsInApp/gte/
        // lte/isNull de drizzle-orm) cuando exista:
        //
        // const sessionLocalDate = this.clock.toLocal(session.startsAt).toISODate()!;
        // const [membership] = await tx
        //     .select({ id: membershipsInApp.id })
        //     .from(membershipsInApp)
        //     .where(
        //         and(
        //             eq(membershipsInApp.memberId, row.member.id),
        //             eq(membershipsInApp.status, 'ACTIVE'),
        //             isNull(membershipsInApp.deletedAt),
        //             lte(membershipsInApp.startDate, sessionLocalDate),
        //             gte(membershipsInApp.endDate, sessionLocalDate),
        //         ),
        //     );
        // if (!membership) {
        //     throw new DomainHttpException(
        //         409,
        //         'MEMBERSHIP_REQUIRED',
        //         'Se requiere una membresía activa que cubra la fecha de la sesión.',
        //         { date: sessionLocalDate },
        //     );
        // }
        return row.member.id;
    }

    /**
     * Ownership provisional sin RBAC: el dueño siempre puede; un usuario SIN
     * perfil de miembro se trata como staff/admin. Un miembro ajeno se
     * rechaza. TODO(RBAC): sustituir por roles verificados del token.
     */
    private async assertOwnerOrStaff(
        db: DbTx | DrizzleService['db'],
        reservation: ReservationRow,
        viewerUserId: string,
    ): Promise<boolean> {
        const member = await this.memberOf(db, viewerUserId);
        if (member?.id === reservation.memberId) return true;
        if (!member) return false; // sin perfil member → staff/admin (provisional)
        throw new DomainHttpException(403, 'RESERVATION_NOT_FOUND', 'La reserva no pertenece al usuario.', {
            reservationId: reservation.id,
        });
    }

    private async countOccupying(db: DbTx | DrizzleService['db'], sessionId: string): Promise<number> {
        const rows = await db
            .select({ id: reservationsInApp.id })
            .from(reservationsInApp)
            .where(and(eq(reservationsInApp.sessionId, sessionId), inArray(reservationsInApp.status, [...OCCUPYING])));
        return rows.length;
    }

    /** Warning (no bloqueo): otras sesiones futuras CONFIRMED que se solapan. */
    private async conflictWarnings(
        db: DbTx | DrizzleService['db'],
        memberId: string,
        session: ClassSessionRow,
        ignoreSessionId?: string,
    ): Promise<DomainWarning[]> {
        const others = await db
            .select({
                sessionId: classSessionsInApp.id,
                startsAt: classSessionsInApp.startsAt,
                endsAt: classSessionsInApp.endsAt,
            })
            .from(reservationsInApp)
            .innerJoin(classSessionsInApp, eq(reservationsInApp.sessionId, classSessionsInApp.id))
            .where(
                and(
                    eq(reservationsInApp.memberId, memberId),
                    eq(reservationsInApp.status, 'CONFIRMED'),
                    eq(classSessionsInApp.status, 'SCHEDULED'),
                    ne(classSessionsInApp.id, session.id),
                    gt(classSessionsInApp.startsAt, this.clock.now().toISO()!),
                ),
            );
        const conflicting = others
            .filter((o) => o.sessionId !== ignoreSessionId)
            .filter((o) => o.startsAt < session.endsAt && o.endsAt > session.startsAt)
            .map((o) => o.sessionId);
        return conflicting.length > 0
            ? [{ code: 'MEMBER_TIME_CONFLICT', details: { conflictingSessionIds: conflicting } }]
            : [];
    }

    /** Recuperación tras 23505: devuelve la reserva vigente propia si existe. */
    private async recoverOwnBooking(
        sessionId: string,
        viewerUserId: string,
    ): Promise<{ result: ReservationMutationResult; created: boolean } | null> {
        const member = await this.memberOf(this.drizzle.db, viewerUserId);
        if (!member) return null;
        const [existing] = await this.drizzle.db
            .select()
            .from(reservationsInApp)
            .where(
                and(
                    eq(reservationsInApp.sessionId, sessionId),
                    eq(reservationsInApp.memberId, member.id),
                    eq(reservationsInApp.status, 'CONFIRMED'),
                ),
            );
        if (!existing) return null;
        return {
            result: { reservation: await this.dtoFor(this.drizzle.db, existing), changed: false, warnings: [] },
            created: false,
        };
    }

    private async loadReservation(db: DbTx | DrizzleService['db'], reservationId: string) {
        const [row] = await db
            .select({ reservation: reservationsInApp, session: classSessionsInApp })
            .from(reservationsInApp)
            .innerJoin(classSessionsInApp, eq(reservationsInApp.sessionId, classSessionsInApp.id))
            .where(eq(reservationsInApp.id, reservationId));
        if (!row) {
            throw new DomainHttpException(404, 'RESERVATION_NOT_FOUND', 'La reserva no existe.', { reservationId });
        }
        return row;
    }

    /** DTO con la sesión (posiblemente ya movida) releída dentro de la tx. */
    private async dtoFor(db: DbTx | DrizzleService['db'], reservation: ReservationRow): Promise<ReservationDto> {
        const [row] = await db
            .select({ session: classSessionsInApp, trainerName: usersInApp.fullName })
            .from(classSessionsInApp)
            .innerJoin(trainersInApp, eq(classSessionsInApp.trainerId, trainersInApp.id))
            .innerJoin(usersInApp, eq(trainersInApp.userId, usersInApp.id))
            .where(eq(classSessionsInApp.id, reservation.sessionId));
        return this.toDto(reservation, row!.session, row!.trainerName);
    }

    private toDto(reservation: ReservationRow, session: ClassSessionRow, trainerName: string): ReservationDto {
        return {
            id: reservation.id,
            status: reservation.status as ReservationDto['status'],
            statusReason: reservation.statusReason as ReservationDto['statusReason'],
            session: {
                id: session.id,
                classId: session.classSeriesId,
                className: session.className,
                trainerId: session.trainerId,
                trainerName,
                startsAt: this.clock.toLocal(session.startsAt).toISO()!,
                endsAt: this.clock.toLocal(session.endsAt).toISO()!,
                status: session.status,
                room: session.room,
                zone: session.zone,
            },
            rescheduledFromReservationId: reservation.rescheduledFromReservationId,
            confirmedAt: reservation.confirmedAt,
            cancelledAt: reservation.cancelledAt,
            attendanceMarkedAt: reservation.attendanceMarkedAt,
            createdAt: reservation.createdAt,
            updatedAt: reservation.updatedAt,
        };
    }

    private toSessionDto(
        session: ClassSessionRow,
        trainerName: string,
        booked: number,
        hasConflict: boolean,
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
            viewer: { reservationId: null, reservationStatus: null, hasConflict },
        };
    }
}
