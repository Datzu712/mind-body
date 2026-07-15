// ⚠️ "Backend" en memoria del módulo Reservas/Clases — sin HTTP, sin persistencia.
//
// Cada función exportada tiene la forma del futuro endpoint REST: el switch al
// backend real = reescribir estos cuerpos con apiFetch('/api/v1/...') sin tocar
// hooks, componentes ni tipos. La lógica de negocio de este archivo
// (materialización tipo cron, cascadas al editar/cancelar, ocupación) es la
// que implementará el server.

import { addDays, format } from 'date-fns';
import type {
    ClassFormData,
    ClassSession,
    ClassStatus,
    GymClass,
    Reservation,
    ReservationStatus,
    SessionOccupancy,
    WaitlistEntry,
} from './types';
import {
    DAY_INDEX,
    endTimeFor,
    isLateCancellation,
    isPastSession,
    sessionStartDate,
    weekDayOf,
    weekStartForOffset,
    WEEK_OFFSET_MAX,
    WEEK_OFFSET_MIN,
} from './utils';

export const MOCK_TRAINERS: string[] = ['Ana Pérez', 'Carlos Ruiz', 'Luis García', 'Juan López', 'Sofía Ramírez'];

interface MockMember {
    id: string;
    name: string;
}

const MOCK_MEMBERS: MockMember[] = [
    { id: 'mem-1', name: 'María López' },
    { id: 'mem-2', name: 'Juan Pérez' },
    { id: 'mem-3', name: 'Ana Torres' },
    { id: 'mem-4', name: 'Luis García' },
    { id: 'mem-5', name: 'Sofía Ramírez' },
    { id: 'mem-6', name: 'Carlos Díaz' },
    { id: 'mem-7', name: 'Laura Jiménez' },
    { id: 'mem-8', name: 'Diego Vargas' },
    { id: 'mem-9', name: 'Valeria Mora' },
    { id: 'mem-10', name: 'Andrés Solano' },
    { id: 'mem-11', name: 'Camila Rojas' },
    { id: 'mem-12', name: 'Jorge Castro' },
    { id: 'mem-13', name: 'Daniela Herrera' },
    { id: 'mem-14', name: 'Pablo Salas' },
    { id: 'mem-15', name: 'Gabriela Chaves' },
    { id: 'mem-16', name: 'Ricardo Alfaro' },
    { id: 'mem-17', name: 'Natalia Quesada' },
    { id: 'mem-18', name: 'Esteban Araya' },
    { id: 'mem-19', name: 'Paula Monge' },
    { id: 'mem-20', name: 'Fernando Brenes' },
    { id: 'mem-21', name: 'Isabel Campos' },
    { id: 'mem-22', name: 'Mauricio Vega' },
    { id: 'mem-23', name: 'Adriana Picado' },
    { id: 'mem-24', name: 'Óscar Villalobos' },
    { id: 'mem-25', name: 'Rebeca Aguilar' },
    { id: 'mem-26', name: 'Tomás Barrantes' },
];

/** Reservas que ocupan cupo (vigentes o resultado de asistencia: el cupo se usó). */
const ACTIVE_STATUSES: readonly ReservationStatus[] = ['confirmada', 'asistio', 'falto'];

// ── Seeds ───────────────────────────────────────────────────────────────────

interface ClassSeed extends GymClass {
    /** Reservas sembradas por sesión (semanas -1 y 0). */
    seedBooked: number;
    /** Lista de espera sembrada por sesión futura. */
    seedWaitlist: number;
}

const CLASS_SEEDS: ClassSeed[] = [
    { id: 'cls-1', name: 'Yoga Flow', description: 'Secuencias fluidas de yoga para flexibilidad y calma.', trainer: 'Ana Pérez', days: ['Lunes', 'Miércoles'], time: '07:00', durationMin: 60, capacity: 10, allowWaitlist: true, status: 'active', seedBooked: 8, seedWaitlist: 0 },
    { id: 'cls-2', name: 'Spinning Sunrise', description: 'Cardio intenso en bicicleta para empezar el día.', trainer: 'Carlos Ruiz', days: ['Lunes', 'Miércoles', 'Viernes'], time: '06:00', durationMin: 50, capacity: 12, allowWaitlist: true, status: 'active', seedBooked: 12, seedWaitlist: 3 },
    { id: 'cls-3', name: 'HIIT Power', description: 'Clase de alta intensidad para quemar grasa.', trainer: 'Carlos Ruiz', days: ['Lunes', 'Jueves'], time: '09:00', durationMin: 45, capacity: 10, allowWaitlist: true, status: 'active', seedBooked: 10, seedWaitlist: 4 },
    { id: 'cls-4', name: 'Zumba', description: 'Baile y cardio con ritmos latinos.', trainer: 'Sofía Ramírez', days: ['Martes', 'Jueves'], time: '19:00', durationMin: 60, capacity: 20, allowWaitlist: true, status: 'active', seedBooked: 20, seedWaitlist: 6 },
    { id: 'cls-5', name: 'Body Pump', description: 'Fuerza con barra y discos al ritmo de la música.', trainer: 'Luis García', days: ['Martes', 'Viernes'], time: '12:00', durationMin: 50, capacity: 15, allowWaitlist: false, status: 'active', seedBooked: 9, seedWaitlist: 0 },
    { id: 'cls-6', name: 'Kickboxing', description: 'Golpes, patadas y acondicionamiento físico.', trainer: 'Juan López', days: ['Jueves'], time: '18:00', durationMin: 60, capacity: 12, allowWaitlist: true, status: 'active', seedBooked: 12, seedWaitlist: 3 },
    { id: 'cls-7', name: 'Pilates Core', description: 'Fortalecimiento del core y postura.', trainer: 'Ana Pérez', days: ['Miércoles', 'Viernes'], time: '10:00', durationMin: 55, capacity: 14, allowWaitlist: true, status: 'active', seedBooked: 6, seedWaitlist: 0 },
    { id: 'cls-8', name: 'Functional Cross', description: 'Entrenamiento funcional por estaciones.', trainer: 'Luis García', days: ['Sábado'], time: '09:00', durationMin: 60, capacity: 16, allowWaitlist: true, status: 'active', seedBooked: 11, seedWaitlist: 0 },
    { id: 'cls-9', name: 'Zumba Weekend', description: 'La fiesta de baile del fin de semana.', trainer: 'Sofía Ramírez', days: ['Sábado'], time: '11:00', durationMin: 60, capacity: 20, allowWaitlist: false, status: 'active', seedBooked: 20, seedWaitlist: 0 },
    { id: 'cls-10', name: 'Stretching & Movilidad', description: 'Estiramientos y movilidad articular para recuperar.', trainer: 'Juan López', days: ['Domingo'], time: '10:00', durationMin: 45, capacity: 12, allowWaitlist: false, status: 'active', seedBooked: 5, seedWaitlist: 0 },
    { id: 'cls-11', name: 'Box Master', description: 'Técnica de boxeo avanzada.', trainer: 'Juan López', days: ['Martes'], time: '20:00', durationMin: 60, capacity: 12, allowWaitlist: true, status: 'inactive', seedBooked: 0, seedWaitlist: 0 },
];

// ── "Base de datos" en memoria ──────────────────────────────────────────────

const db = {
    classes: [] as GymClass[],
    sessions: [] as ClassSession[],
    reservations: [] as Reservation[],
};

const clone = <T,>(value: T): T => structuredClone(value);

function countFor(sessionId: string, statuses: readonly ReservationStatus[]): number {
    return db.reservations.filter((r) => r.sessionId === sessionId && statuses.includes(r.status)).length;
}

function withOccupancy(session: ClassSession): SessionOccupancy {
    return {
        ...session,
        booked: countFor(session.id, ACTIVE_STATUSES),
        waitlistCount: countFor(session.id, ['en-espera']),
    };
}

/** Cancela las reservas vigentes (confirmada/en-espera) de una sesión; devuelve cuántas. */
function cancelActiveReservations(sessionId: string): number {
    let count = 0;
    for (const r of db.reservations) {
        if (r.sessionId === sessionId && (r.status === 'confirmada' || r.status === 'en-espera')) {
            r.status = 'cancelada';
            count++;
        }
    }
    return count;
}

function futureSessionsOf(classId: string): ClassSession[] {
    return db.sessions.filter((s) => s.classId === classId && !isPastSession(s));
}

/** Fechas programadas por la recurrencia de la clase en el rango de semanas generado. */
function scheduledDates(cls: GymClass): string[] {
    const dates: string[] = [];
    for (let offset = WEEK_OFFSET_MIN; offset <= WEEK_OFFSET_MAX; offset++) {
        const start = weekStartForOffset(offset);
        for (const day of cls.days) {
            dates.push(format(addDays(start, DAY_INDEX[day]), 'yyyy-MM-dd'));
        }
    }
    return dates;
}

function buildSession(cls: GymClass, date: string): ClassSession {
    return {
        id: `ses-${cls.id}-${date}`,
        classId: cls.id,
        className: cls.name,
        trainer: cls.trainer,
        date,
        startTime: cls.time,
        endTime: endTimeFor(cls.time, cls.durationMin),
        capacity: cls.capacity,
        status: 'programada',
    };
}

/** Materializa (como el cron) las sesiones que falten de una clase en el rango. */
function materializeMissingSessions(cls: GymClass, opts: { futureOnly: boolean }): void {
    for (const date of scheduledDates(cls)) {
        const session = buildSession(cls, date);
        if (opts.futureOnly && isPastSession(session)) continue;
        if (!db.sessions.some((s) => s.id === session.id)) db.sessions.push(session);
    }
}

// ── Seed inicial ────────────────────────────────────────────────────────────
// Sesiones de las semanas -1 a +2; reservas solo en semanas -1 y 0. Las
// sesiones ya ocurridas quedan con resultado de asistencia (~1 de cada 5
// 'falto'); las futuras quedan 'confirmada' y solo ellas siembran espera.

function seed(): void {
    let memberCursor = 0;
    const takeMember = () => MOCK_MEMBERS[memberCursor++ % MOCK_MEMBERS.length];
    const seedBase = weekStartForOffset(-1);
    const seededAt = (i: number) =>
        new Date(seedBase.getFullYear(), seedBase.getMonth(), seedBase.getDate(), 9, i).toISOString();

    for (const { seedBooked: _b, seedWaitlist: _w, ...cls } of CLASS_SEEDS) {
        db.classes.push(cls);
        if (cls.status === 'active') materializeMissingSessions(cls, { futureOnly: false });
    }

    const reservationWindowEnd = format(addDays(weekStartForOffset(0), 6), 'yyyy-MM-dd');
    for (const session of db.sessions) {
        if (session.date > reservationWindowEnd) continue;
        const seedDef = CLASS_SEEDS.find((c) => c.id === session.classId);
        if (!seedDef) continue;
        const past = isPastSession(session);
        for (let i = 0; i < seedDef.seedBooked; i++) {
            const member = takeMember();
            db.reservations.push({
                id: `res-${session.id}-${i}`,
                sessionId: session.id,
                memberId: member.id,
                memberName: member.name,
                status: past ? (i > 0 && i % 5 === 0 ? 'falto' : 'asistio') : 'confirmada',
                createdAt: seededAt(db.reservations.length),
            });
        }
        if (past) continue;
        for (let i = 0; i < seedDef.seedWaitlist; i++) {
            const member = takeMember();
            db.reservations.push({
                id: `res-${session.id}-wl-${i}`,
                sessionId: session.id,
                memberId: member.id,
                memberName: member.name,
                status: 'en-espera',
                createdAt: seededAt(db.reservations.length),
            });
        }
    }

    const firstUpcoming = [...db.sessions]
        .filter((s) => !isPastSession(s))
        .sort((a, b) => sessionStartDate(a).getTime() - sessionStartDate(b).getTime())[0];
    if (firstUpcoming) {
        db.reservations.push({
            id: 'res-seed-cancelada',
            sessionId: firstUpcoming.id,
            memberId: MOCK_MEMBERS[24].id,
            memberName: MOCK_MEMBERS[24].name,
            status: 'cancelada',
            createdAt: seededAt(db.reservations.length),
        });
    }
}

seed();

// ── Endpoints: clases ───────────────────────────────────────────────────────

export async function fetchClasses(): Promise<GymClass[]> {
    return clone(db.classes);
}

export async function fetchTrainers(): Promise<string[]> {
    return [...MOCK_TRAINERS];
}

export async function createClass(dto: ClassFormData): Promise<GymClass> {
    const cls: GymClass = { id: `cls-${Date.now()}`, ...dto };
    db.classes.push(cls);
    if (cls.status === 'active') materializeMissingSessions(cls, { futureOnly: true });
    return clone(cls);
}

export async function updateClass(id: string, dto: ClassFormData): Promise<{ affectedReservations: number }> {
    const cls = db.classes.find((c) => c.id === id);
    if (!cls) throw new Error('Clase no encontrada');
    Object.assign(cls, dto);

    // Re-materializa el futuro: actualiza las sesiones que siguen en el
    // horario, cancela las de días eliminados (la fila se conserva, no se
    // borra), crea las de días nuevos. Las canceladas a mano no se reviven.
    let affected = 0;
    for (const session of futureSessionsOf(id)) {
        if (session.status === 'cancelada') continue;
        if (cls.status === 'active' && cls.days.includes(weekDayOf(session.date))) {
            session.className = cls.name;
            session.trainer = cls.trainer;
            session.startTime = cls.time;
            session.endTime = endTimeFor(cls.time, cls.durationMin);
            session.capacity = cls.capacity;
        } else {
            session.status = 'cancelada';
            affected += cancelActiveReservations(session.id);
        }
    }
    if (cls.status === 'active') materializeMissingSessions(cls, { futureOnly: true });
    return { affectedReservations: affected };
}

export async function setClassStatus(id: string, status: ClassStatus): Promise<{ affectedReservations: number }> {
    const cls = db.classes.find((c) => c.id === id);
    if (!cls) throw new Error('Clase no encontrada');
    cls.status = status;

    let affected = 0;
    if (status === 'inactive') {
        for (const session of futureSessionsOf(id)) {
            if (session.status === 'cancelada') continue;
            session.status = 'cancelada';
            affected += cancelActiveReservations(session.id);
        }
    } else {
        // Reactivar restaura el horario vigente: revive futuras del horario y crea faltantes.
        for (const session of futureSessionsOf(id)) {
            if (cls.days.includes(weekDayOf(session.date))) session.status = 'programada';
        }
        materializeMissingSessions(cls, { futureOnly: true });
    }
    return { affectedReservations: affected };
}

export async function deleteClass(id: string): Promise<{ affectedReservations: number }> {
    let affected = 0;
    for (const session of futureSessionsOf(id)) {
        affected += cancelActiveReservations(session.id);
    }
    // Las sesiones pasadas (y su historial de asistencia) se conservan.
    db.sessions = db.sessions.filter((s) => s.classId !== id || isPastSession(s));
    db.classes = db.classes.filter((c) => c.id !== id);
    return { affectedReservations: affected };
}

// ── Endpoints: sesiones ─────────────────────────────────────────────────────

export async function fetchSessions(from: string, to: string): Promise<SessionOccupancy[]> {
    return db.sessions.filter((s) => s.date >= from && s.date <= to).map((s) => clone(withOccupancy(s)));
}

export async function fetchSession(id: string): Promise<SessionOccupancy | null> {
    const session = db.sessions.find((s) => s.id === id);
    return session ? clone(withOccupancy(session)) : null;
}

export async function moveSession(id: string, dto: { date: string; startTime: string }): Promise<void> {
    const session = db.sessions.find((s) => s.id === id);
    if (!session) throw new Error('Sesión no encontrada');
    const [sh, sm] = session.startTime.split(':').map(Number);
    const [eh, em] = session.endTime.split(':').map(Number);
    const durationMin = eh * 60 + em - (sh * 60 + sm);
    session.date = dto.date;
    session.startTime = dto.startTime;
    session.endTime = endTimeFor(dto.startTime, durationMin);
}

export async function cancelSession(id: string): Promise<{ affectedReservations: number }> {
    const session = db.sessions.find((s) => s.id === id);
    if (!session) throw new Error('Sesión no encontrada');
    session.status = 'cancelada';
    return { affectedReservations: cancelActiveReservations(id) };
}

// ── Endpoints: reservas ─────────────────────────────────────────────────────

export async function fetchSessionReservations(sessionId: string): Promise<Reservation[]> {
    return clone(db.reservations.filter((r) => r.sessionId === sessionId && r.status !== 'en-espera'));
}

export async function fetchSessionWaitlist(sessionId: string): Promise<WaitlistEntry[]> {
    return db.reservations
        .filter((r) => r.sessionId === sessionId && r.status === 'en-espera')
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
        .map((r, i) => ({ reservationId: r.id, memberName: r.memberName, position: i + 1 }));
}

export async function cancelReservation(id: string): Promise<{ registeredAsNoShow: boolean }> {
    const reservation = db.reservations.find((r) => r.id === id);
    if (!reservation) throw new Error('Reserva no encontrada');
    const session = db.sessions.find((s) => s.id === reservation.sessionId);
    const noShow = session ? isLateCancellation(session) : false;
    reservation.status = noShow ? 'falto' : 'cancelada';
    return { registeredAsNoShow: noShow };
}

export async function rescheduleReservation(id: string, newSessionId: string): Promise<void> {
    const reservation = db.reservations.find((r) => r.id === id);
    if (!reservation) throw new Error('Reserva no encontrada');
    reservation.sessionId = newSessionId;
    reservation.status = 'confirmada';
}

export async function markAttendance(id: string, attended: boolean): Promise<void> {
    const reservation = db.reservations.find((r) => r.id === id);
    if (!reservation) throw new Error('Reserva no encontrada');
    reservation.status = attended ? 'asistio' : 'falto';
}

export async function promoteFromWaitlist(id: string): Promise<void> {
    const reservation = db.reservations.find((r) => r.id === id);
    if (!reservation) throw new Error('Reserva no encontrada');
    const session = db.sessions.find((s) => s.id === reservation.sessionId);
    if (!session || countFor(session.id, ACTIVE_STATUSES) >= session.capacity) {
        throw new Error('La sesión no tiene cupo disponible');
    }
    reservation.status = 'confirmada';
}

export async function removeFromWaitlist(id: string): Promise<void> {
    const reservation = db.reservations.find((r) => r.id === id);
    if (!reservation) throw new Error('Reserva no encontrada');
    reservation.status = 'cancelada';
}

export async function fetchRescheduleOptions(reservationId: string): Promise<SessionOccupancy[]> {
    const reservation = db.reservations.find((r) => r.id === reservationId);
    const current = reservation && db.sessions.find((s) => s.id === reservation.sessionId);
    if (!current) return [];
    return db.sessions
        .filter(
            (s) =>
                s.classId === current.classId && s.id !== current.id && s.status === 'programada' && !isPastSession(s),
        )
        .map(withOccupancy)
        .filter((s) => s.booked < s.capacity)
        .sort((a, b) => sessionStartDate(a).getTime() - sessionStartDate(b).getTime())
        .map(clone);
}
