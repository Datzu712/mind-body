/**
 * Integración contra PostgreSQL REAL (Task 10 del plan): crea una BD scratch,
 * aplica las migraciones Drizzle y ejercita locks, constraints (unique parcial,
 * exclusión GiST) y reglas de negocio que los mocks no pueden probar.
 *
 * Requiere DATABASE_URL (se toma de .env); sin ella el suite se salta.
 */
import 'dotenv/config';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import postgres from 'postgres';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { DateTime } from 'luxon';

import { DrizzleService } from '@/infra/database/pg/drizzle.service';
import {
    classSeriesInApp,
    classSeriesWeekdaysInApp,
    classSessionsInApp,
    membersInApp,
    membershipPlansInApp,
    membershipsInApp,
    reservationsInApp,
    trainersInApp,
    usersInApp,
} from '@/infra/database/pg/schemas/schema';
import type { TypedConfigService } from '@/config/typed-config.service';
import { ClockService } from '@/common/clock/clock.service';
import { SessionMaterializerService } from '@/modules/classes/session-materializer.service';
import { ClassesService } from '@/modules/classes/classes.service';
import { ClassSessionsService } from '@/modules/class-sessions/class-sessions.service';
import { ReservationsService } from '@/modules/reservations/reservations.service';
import { DomainHttpException } from '@/common/domain/domain-http.exception';
import type { Actor } from '@/common/auth/actor';

const BASE_URL = process.env['DATABASE_URL'];
const SCRATCH_DB = 'mab_reservations_int_test';
const runIf = BASE_URL ? describe : describe.skip;

// En local se salta sin ruido, pero en CI un "skipped" se lee como "passed" y
// aquí viven las pruebas de autorización a nivel de servicio: si falta la BD,
// que truene.
if (!BASE_URL && process.env['CI']) {
    throw new Error('DATABASE_URL es obligatorio en CI: la suite de integración de reservas no puede saltarse.');
}

const fakeConfig = {
    getOrThrow: (key: string) =>
        ({ BUSINESS_TIME_ZONE: 'America/Costa_Rica', SESSION_MATERIALIZATION_WEEKS_AHEAD: 8 })[key],
} as unknown as TypedConfigService;

function scratchUrl(baseUrl: string): string {
    const url = new URL(baseUrl);
    url.pathname = `/${SCRATCH_DB}`;
    return url.toString();
}

/** Los services autorizan con los roles del token, no con la presencia de un perfil. */
const memberActor = (userId: string): Actor => ({ userId, roles: ['MEMBER'] });
const managementActor = (userId: string): Actor => ({ userId, roles: ['ADMIN'] });
const trainerActor = (userId: string): Actor => ({ userId, roles: ['TRAINER'] });
// Combinación que produce el propio flujo del producto (perfil TRAINER + MEMBER).
const trainerMemberActor = (userId: string): Actor => ({ userId, roles: ['TRAINER', 'MEMBER'] });

async function expectDomainError<T>(work: Promise<T>, code: string): Promise<void> {
    try {
        await work;
        expect.fail(`Se esperaba DomainHttpException ${code}`);
    } catch (error) {
        if (!(error instanceof DomainHttpException)) throw error;
        expect((error.getResponse() as { code: string }).code).toBe(code);
    }
}

runIf('reservations backend (PostgreSQL real)', () => {
    let admin: postgres.Sql;
    let drizzleService: DrizzleService;
    let clock: ClockService;
    let materializer: SessionMaterializerService;
    let classes: ClassesService;
    let sessions: ClassSessionsService;
    let reservations: ReservationsService;

    let adminUserId: string;
    let trainerId: string;
    let trainerUserId: string;
    let sessionHourOffset = 24; // separa sesiones seed para no chocar con la exclusión GiST

    const db = () => drizzleService.db;

    async function seedMember(name: string): Promise<{ userId: string; memberId: string }> {
        const [user] = await db()
            .insert(usersInApp)
            .values({ keycloakSubject: crypto.randomUUID(), fullName: name, status: 'ACTIVE' })
            .returning();
        const [member] = await db().insert(membersInApp).values({ userId: user!.id, status: 'ACTIVE' }).returning();
        const [plan] = await db()
            .insert(membershipPlansInApp)
            .values({ name: `Plan ${name} ${crypto.randomUUID().slice(0, 8)}`, durationDays: 3650, price: '10.00' })
            .returning();
        await db().insert(membershipsInApp).values({
            memberId: member!.id,
            planId: plan!.id,
            startDate: '2020-01-01',
            endDate: '2035-12-31',
            status: 'ACTIVE',
        });
        return { userId: user!.id, memberId: member!.id };
    }

    /** Sesión suelta (sin materializador) a N horas de ahora, horario único. */
    async function seedSession(seriesId: string, opts: { inHours?: number; capacity?: number } = {}) {
        const startsAt = DateTime.now()
            .plus({ hours: opts.inHours ?? sessionHourOffset })
            .startOf('minute');
        sessionHourOffset += 2;
        const [session] = await db()
            .insert(classSessionsInApp)
            .values({
                classSeriesId: seriesId,
                originDate: startsAt.setZone('America/Costa_Rica').toISODate()!,
                startsAt: startsAt.toISO()!,
                endsAt: startsAt.plus({ minutes: 60 }).toISO()!,
                className: 'Seed',
                description: '',
                trainerId,
                capacity: opts.capacity ?? 10,
                allowWaitlist: false,
                sourceSeriesVersion: 1,
            })
            .returning();
        return session!;
    }

    /**
     * A trainer of its own. `excl_class_sessions_trainer_overlap` is scoped by
     * trainer, so a test that pins a wall-clock start time must not share the
     * suite-wide trainer: `seedSession` lays sessions down at now+2h, now+4h, …
     * and one of them lands inside the pinned window depending on the hour the
     * suite happens to run at.
     */
    async function seedTrainer(fullName: string): Promise<string> {
        const [user] = await db()
            .insert(usersInApp)
            .values({ keycloakSubject: crypto.randomUUID(), fullName, status: 'ACTIVE' })
            .returning();
        const [trainer] = await db().insert(trainersInApp).values({ userId: user!.id, status: 'ACTIVE' }).returning();
        return trainer!.id;
    }

    async function seedSeries(weekdays: number[] = [1]): Promise<string> {
        const [series] = await db()
            .insert(classSeriesInApp)
            .values({
                trainerId,
                name: `Serie seed ${crypto.randomUUID().slice(0, 8)}`,
                localStartTime: '06:00',
                durationMinutes: 60,
                capacity: 10,
                allowWaitlist: false,
                startsOn: '2020-01-01',
                status: 'ACTIVE',
                createdByUserId: adminUserId,
                updatedByUserId: adminUserId,
            })
            .returning();
        await db()
            .insert(classSeriesWeekdaysInApp)
            .values(weekdays.map((isoWeekday) => ({ classSeriesId: series!.id, isoWeekday })));
        return series!.id;
    }

    beforeAll(async () => {
        admin = postgres(BASE_URL!, { max: 1 });
        await admin.unsafe(`DROP DATABASE IF EXISTS ${SCRATCH_DB}`);
        await admin.unsafe(`CREATE DATABASE ${SCRATCH_DB}`);

        const url = scratchUrl(BASE_URL!);
        const migrator = postgres(url, { max: 1 });
        await migrate(drizzle(migrator), { migrationsFolder: './drizzle' });
        await migrator.end();

        process.env['DATABASE_URL'] = url;
        drizzleService = new DrizzleService();
        process.env['DATABASE_URL'] = BASE_URL;

        clock = new ClockService(fakeConfig);
        materializer = new SessionMaterializerService(drizzleService, clock, fakeConfig);
        classes = new ClassesService(drizzleService, clock, materializer);
        sessions = new ClassSessionsService(drizzleService, clock);
        reservations = new ReservationsService(drizzleService, clock);

        const [adminUser] = await db()
            .insert(usersInApp)
            .values({ keycloakSubject: crypto.randomUUID(), fullName: 'Admin Test', status: 'ACTIVE' })
            .returning();
        adminUserId = adminUser!.id;
        const [trainerUser] = await db()
            .insert(usersInApp)
            .values({ keycloakSubject: crypto.randomUUID(), fullName: 'Trainer Test', status: 'ACTIVE' })
            .returning();
        trainerUserId = trainerUser!.id;
        const [trainer] = await db()
            .insert(trainersInApp)
            .values({ userId: trainerUser!.id, status: 'ACTIVE' })
            .returning();
        trainerId = trainer!.id;
    }, 60_000);

    afterAll(async () => {
        await drizzleService?.onModuleDestroy();
        if (admin) {
            await admin.unsafe(`DROP DATABASE IF EXISTS ${SCRATCH_DB} WITH (FORCE)`);
            await admin.end();
        }
    });

    it('crear una serie materializa sesiones idempotentes dentro del horizonte', async () => {
        const today = DateTime.now().setZone('America/Costa_Rica');
        const result = await classes.create(
            {
                name: 'Yoga Integración',
                description: 'test',
                trainerId,
                weekdays: [1, 3],
                localStartTime: '23:30',
                durationMinutes: 25,
                capacity: 5,
                allowWaitlist: false,
                startsOn: today.toISODate()!,
                status: 'ACTIVE',
            },
            adminUserId,
        );
        expect(result.classSeries.status).toBe('ACTIVE');
        expect(result.impact.affectedSessions).toBeGreaterThan(10); // ~2/semana × 8 semanas

        // Segunda corrida (cron): no duplica nada.
        const metrics = await materializer.run('cron');
        expect(metrics?.sessionsInserted).toBe(0);
    });

    it('dos series solapadas del mismo entrenador chocan con TRAINER_TIME_CONFLICT', async () => {
        const today = DateTime.now().setZone('America/Costa_Rica').toISODate()!;
        const base = {
            description: '',
            trainerId,
            weekdays: [2],
            localStartTime: '22:00',
            durationMinutes: 60,
            capacity: 5,
            allowWaitlist: false,
            startsOn: today,
            status: 'ACTIVE' as const,
        };
        await classes.create({ ...base, name: 'Spinning A' }, adminUserId);
        await expectDomainError(classes.create({ ...base, name: 'Spinning B' }, adminUserId), 'TRAINER_TIME_CONFLICT');
    });

    it('booking: crea, recupera retries y rechaza cuando se llena', async () => {
        const seriesId = await seedSeries();
        const session = await seedSession(seriesId, { capacity: 1 });
        const memberA = await seedMember('Member A');
        const memberB = await seedMember('Member B');

        const first = await reservations.book(session.id, memberA.userId);
        expect(first.created).toBe(true);
        expect(first.result.reservation.status).toBe('CONFIRMED');

        const retry = await reservations.book(session.id, memberA.userId);
        expect(retry.created).toBe(false);
        expect(retry.result.changed).toBe(false);
        expect(retry.result.reservation.id).toBe(first.result.reservation.id);

        await expectDomainError(reservations.book(session.id, memberB.userId), 'SESSION_FULL');
    });

    it('carrera por el último cupo: exactamente una reserva confirmada', async () => {
        const seriesId = await seedSeries();
        const session = await seedSession(seriesId, { capacity: 1 });
        const memberC = await seedMember('Member C');
        const memberD = await seedMember('Member D');

        const outcomes = await Promise.allSettled([
            reservations.book(session.id, memberC.userId),
            reservations.book(session.id, memberD.userId),
        ]);
        const ok = outcomes.filter((o) => o.status === 'fulfilled');
        const failed = outcomes.filter((o) => o.status === 'rejected');
        expect(ok).toHaveLength(1);
        expect(failed).toHaveLength(1);
        const reason = (failed[0] as PromiseRejectedResult).reason as DomainHttpException;
        expect((reason.getResponse() as { code: string }).code).toBe('SESSION_FULL');
    });

    it('cancelación tardía (<12h) queda NO_SHOW y conserva el cupo; repetirla es idempotente', async () => {
        const seriesId = await seedSeries();
        const session = await seedSession(seriesId, { inHours: 2, capacity: 3 });
        const member = await seedMember('Late Canceller');

        const booking = await reservations.book(session.id, member.userId);
        const result = await reservations.cancel(booking.result.reservation.id, undefined, memberActor(member.userId));
        expect(result.registeredAsNoShow).toBe(true);
        expect(result.reservation.status).toBe('NO_SHOW');
        expect(result.reservation.statusReason).toBe('LATE_CANCELLATION');

        const repeat = await reservations.cancel(booking.result.reservation.id, undefined, memberActor(member.userId));
        expect(repeat.changed).toBe(false);
        expect(repeat.registeredAsNoShow).toBe(true);
    });

    it('cancelación a tiempo libera el cupo; ADMIN_OVERRIDE tardío no penaliza', async () => {
        const seriesId = await seedSeries();
        const onTime = await seedSession(seriesId, { inHours: 100, capacity: 3 });
        const member = await seedMember('OnTime Canceller');

        const booking = await reservations.book(onTime.id, member.userId);
        const result = await reservations.cancel(booking.result.reservation.id, undefined, memberActor(member.userId));
        expect(result.registeredAsNoShow).toBe(false);
        expect(result.reservation.status).toBe('CANCELLED');
        expect(result.reservation.statusReason).toBe('MEMBER_CANCELLED');

        // Override administrativo dentro de la ventana tardía → CANCELLED, no NO_SHOW.
        const late = await seedSession(seriesId, { inHours: 3, capacity: 3 });
        const booking2 = await reservations.book(late.id, member.userId);
        const override = await reservations.cancel(
            booking2.result.reservation.id,
            { reason: 'ADMIN_OVERRIDE', note: 'lesión reportada' },
            managementActor(adminUserId),
        );
        expect(override.registeredAsNoShow).toBe(false);
        expect(override.reservation.statusReason).toBe('ADMIN_CANCELLED');
    });

    it('reprogramación atómica enlazada + recuperación de retry', async () => {
        const seriesId = await seedSeries();
        // Separadas >24h entre sí: (class_series_id, origin_date) es UNIQUE, y con
        // 80h/90h las dos caían en la misma fecha local según la hora de la corrida.
        const origin = await seedSession(seriesId, { inHours: 50, capacity: 3 });
        const target = await seedSession(seriesId, { inHours: 80, capacity: 3 });
        const other = await seedSession(seriesId, { inHours: 110, capacity: 3 });
        const member = await seedMember('Rescheduler');

        const booking = await reservations.book(origin.id, member.userId);
        const originId = booking.result.reservation.id;

        const moved = await reservations.reschedule(
            originId,
            { targetSessionId: target.id },
            memberActor(member.userId),
        );
        expect(moved.changed).toBe(true);
        expect(moved.reservation.status).toBe('CONFIRMED');
        expect(moved.reservation.statusReason).toBe('RESCHEDULED');
        expect(moved.reservation.rescheduledFromReservationId).toBe(originId);
        expect(moved.reservation.session.id).toBe(target.id);

        // Retry idéntico recupera el mismo destino sin duplicar.
        const retry = await reservations.reschedule(
            originId,
            { targetSessionId: target.id },
            memberActor(member.userId),
        );
        expect(retry.changed).toBe(false);
        expect(retry.reservation.id).toBe(moved.reservation.id);

        // Retry hacia OTRO destino no reescribe la historia.
        await expectDomainError(
            reservations.reschedule(originId, { targetSessionId: other.id }, memberActor(member.userId)),
            'INVALID_RESERVATION_STATE',
        );

        // Reprogramar hacia la misma sesión responde TARGET_SAME_SESSION.
        await expectDomainError(
            reservations.reschedule(moved.reservation.id, { targetSessionId: target.id }, memberActor(member.userId)),
            'TARGET_SAME_SESSION',
        );
    });

    it('ownership por roles del token: miembro ajeno y TRAINER no pueden; gestión exige intención', async () => {
        const seriesId = await seedSeries();
        const session = await seedSession(seriesId, { inHours: 70, capacity: 3 });
        const owner = await seedMember('Owner Rights');
        const stranger = await seedMember('Stranger Rights');

        const booking = await reservations.book(session.id, owner.userId);
        const reservationId = booking.result.reservation.id;

        // Miembro ajeno: 403 con el mismo código que un 404 para no filtrar la reserva.
        await expectDomainError(
            reservations.cancel(reservationId, undefined, memberActor(stranger.userId)),
            'RESERVATION_NOT_FOUND',
        );
        await expectDomainError(
            reservations.rescheduleOptions(reservationId, memberActor(stranger.userId)),
            'RESERVATION_NOT_FOUND',
        );

        // TRAINER: sin perfil de miembro, antes se le trataba como staff.
        await expectDomainError(
            reservations.cancel(
                reservationId,
                { reason: 'ADMIN_OVERRIDE', note: 'intento del entrenador' },
                trainerActor(trainerUserId),
            ),
            'RESERVATION_NOT_FOUND',
        );

        // Gestión sobre reserva ajena: sigue exigiendo body con intención explícita.
        await expect(reservations.cancel(reservationId, undefined, managementActor(adminUserId))).rejects.toThrow(
            /exige body/,
        );

        const cancelled = await reservations.cancel(
            reservationId,
            { reason: 'ADMIN_OVERRIDE', note: 'gestión' },
            managementActor(adminUserId),
        );
        expect(cancelled.changed).toBe(true);
        expect(cancelled.reservation.statusReason).toBe('ADMIN_CANCELLED');
    });

    it('roster: el TRAINER solo lee el de sus propias sesiones', async () => {
        const seriesId = await seedSeries();
        const session = await seedSession(seriesId, { inHours: 76, capacity: 3 });
        const member = await seedMember('Roster Member');
        await reservations.book(session.id, member.userId);

        const [otherUser] = await db()
            .insert(usersInApp)
            .values({ keycloakSubject: crypto.randomUUID(), fullName: 'Otro Entrenador', status: 'ACTIVE' })
            .returning();
        await db().insert(trainersInApp).values({ userId: otherUser!.id, status: 'ACTIVE' });

        // Dueño de la sesión y gestión: ven el roster completo.
        expect(await reservations.roster(session.id, trainerActor(trainerUserId))).toHaveLength(1);
        expect(await reservations.roster(session.id, managementActor(adminUserId))).toHaveLength(1);

        // Entrenador ajeno a la sesión: 403 disfrazado de 404.
        await expectDomainError(reservations.roster(session.id, trainerActor(otherUser!.id)), 'SESSION_NOT_FOUND');

        // El rol MEMBER no exime del recorte en el roster (solo en el catálogo).
        await expectDomainError(
            reservations.roster(session.id, trainerMemberActor(otherUser!.id)),
            'SESSION_NOT_FOUND',
        );

        // Rol TRAINER sin perfil de entrenador en el dominio.
        await expectDomainError(reservations.roster(session.id, trainerActor(member.userId)), 'TRAINER_NOT_FOUND');
    });

    it('lectura de clases y sesiones recortada al entrenador', async () => {
        const seriesId = await seedSeries();
        const session = await seedSession(seriesId, { inHours: 82, capacity: 3 });

        const [otherUser] = await db()
            .insert(usersInApp)
            .values({ keycloakSubject: crypto.randomUUID(), fullName: 'Entrenador Sin Clases', status: 'ACTIVE' })
            .returning();
        await db().insert(trainersInApp).values({ userId: otherUser!.id, status: 'ACTIVE' });

        const ownView = await classes.list({}, trainerActor(trainerUserId));
        expect(ownView.length).toBeGreaterThan(0);
        expect(ownView.every((series) => series.trainerId === trainerId)).toBe(true);
        expect(await classes.list({}, trainerActor(otherUser!.id))).toHaveLength(0);

        // El rol MEMBER tampoco abre las series ajenas.
        expect(await classes.list({}, trainerMemberActor(otherUser!.id))).toHaveLength(0);

        // La serie ajena no se puede abrir en detalle.
        await expectDomainError(classes.detail(seriesId, trainerActor(otherUser!.id)), 'CLASS_NOT_FOUND');
        expect((await classes.detail(seriesId, trainerActor(trainerUserId))).id).toBe(seriesId);

        const range = {
            from: DateTime.now().setZone('America/Costa_Rica').toISODate()!,
            to: DateTime.now().plus({ days: 7 }).setZone('America/Costa_Rica').toISODate()!,
        };

        // `mine=true` es la agenda propia: filtro explícito, no permiso.
        const agenda = await sessions.list({ ...range, mine: true }, trainerActor(trainerUserId));
        expect(agenda.length).toBeGreaterThan(0);
        expect(agenda.every((s) => s.trainerId === trainerId)).toBe(true);
        expect(await sessions.list({ ...range, mine: true }, trainerActor(otherUser!.id))).toHaveLength(0);

        // Sin el filtro, el catálogo es el mismo para cualquier rol: es la agenda
        // del gimnasio que mobile ya muestra a los miembros.
        const member = await seedMember('Catalog Browser');
        for (const viewer of [
            memberActor(member.userId),
            trainerActor(otherUser!.id),
            trainerMemberActor(otherUser!.id),
            managementActor(adminUserId),
        ]) {
            expect((await sessions.list(range, viewer)).some((s) => s.id === session.id)).toBe(true);
            expect((await sessions.detail(session.id, viewer)).id).toBe(session.id);
        }

        // `mine=true` sin perfil de entrenador no devuelve el catálogo entero.
        await expectDomainError(
            sessions.list({ ...range, mine: true }, memberActor(member.userId)),
            'TRAINER_NOT_FOUND',
        );
    });

    it('asistencia solo después del inicio y con corrección ATTENDED <-> NO_SHOW', async () => {
        const seriesId = await seedSeries();
        const future = await seedSession(seriesId, { inHours: 60, capacity: 3 });
        const member = await seedMember('Attendee');
        const booking = await reservations.book(future.id, member.userId);

        await expectDomainError(
            reservations.markAttendance(booking.result.reservation.id, { attended: true }, adminUserId),
            'SESSION_ALREADY_STARTED',
        );

        // Sesión ya iniciada (insertada en el pasado, sin reserva previa posible
        // vía API): se inserta la sesión pasada y la reserva directo en BD.
        const past = await seedSession(seriesId, { inHours: -2, capacity: 3 });
        const [row] = await db()
            .insert(reservationsInApp)
            .values({
                sessionId: past.id,
                memberId: member.memberId,
                status: 'CONFIRMED',
                statusReason: 'MEMBER_BOOKED',
                confirmedAt: DateTime.now().minus({ hours: 5 }).toISO()!,
                createdByUserId: member.userId,
            })
            .returning();

        const attended = await reservations.markAttendance(row!.id, { attended: true }, adminUserId);
        expect(attended.reservation.status).toBe('ATTENDED');

        const corrected = await reservations.markAttendance(row!.id, { attended: false, note: 'error' }, adminUserId);
        expect(corrected.reservation.status).toBe('NO_SHOW');
        expect(corrected.reservation.statusReason).toBe('ATTENDANCE');

        const idempotent = await reservations.markAttendance(row!.id, { attended: false }, adminUserId);
        expect(idempotent.changed).toBe(false);
    });

    it('bajar capacidad por debajo de la ocupación responde CAPACITY_BELOW_OCCUPANCY', async () => {
        const today = DateTime.now().setZone('America/Costa_Rica').toISODate()!;
        // Own trainer: this test pins 21:00 every weekday, which collides with the
        // shared trainer's ad-hoc sessions whenever the suite runs near that hour.
        const capacityTrainerId = await seedTrainer('Trainer Capacidad');
        const created = await classes.create(
            {
                name: 'Capacidad Test',
                description: '',
                trainerId: capacityTrainerId,
                weekdays: [1, 2, 3, 4, 5, 6, 7],
                localStartTime: '21:00',
                durationMinutes: 30,
                capacity: 2,
                allowWaitlist: false,
                startsOn: today,
                status: 'ACTIVE',
            },
            adminUserId,
        );
        const seriesId = created.classSeries.id;
        const [firstSession] = await db()
            .select()
            .from(classSessionsInApp)
            .where(eq(classSessionsInApp.classSeriesId, seriesId))
            .orderBy(classSessionsInApp.startsAt)
            .limit(1);

        const m1 = await seedMember('Cap One');
        const m2 = await seedMember('Cap Two');
        await reservations.book(firstSession!.id, m1.userId);
        await reservations.book(firstSession!.id, m2.userId);

        const dto = {
            name: 'Capacidad Test',
            description: '',
            trainerId: capacityTrainerId,
            weekdays: [1, 2, 3, 4, 5, 6, 7],
            localStartTime: '21:00',
            durationMinutes: 30,
            capacity: 1,
            allowWaitlist: false,
            startsOn: today,
        };
        await expectDomainError(
            classes.update(seriesId, dto, adminUserId, `"${created.classSeries.version}"`),
            'CAPACITY_BELOW_OCCUPANCY',
        );

        // If-Match: sin header → 428; versión vieja → 412.
        await expectDomainError(
            classes.update(seriesId, { ...dto, capacity: 5 }, adminUserId),
            'PRECONDITION_REQUIRED',
        );
        await expectDomainError(
            classes.update(seriesId, { ...dto, capacity: 5 }, adminUserId, '"999"'),
            'VERSION_CONFLICT',
        );
    });
});
