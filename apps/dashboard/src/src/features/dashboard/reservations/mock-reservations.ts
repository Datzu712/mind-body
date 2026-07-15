// Mock data for the Reservations module — Dashboard (HU-RES-004 y gestión administrativa).
//
// ⚠️ FRONTEND MOCK — no backend, no HTTP. Types mirror future API DTOs so they
// can be swapped for react-query hooks against `apps/restapi` with minimal churn.
//
// Las sesiones se derivan del horario semanal de `mockManagedClasses`; la
// ocupación (booked/waitlistCount) NO vive acá: se computa desde las reservas
// en `use-reservations-mock.ts` para que haya una sola fuente de verdad.

import { addDays, addWeeks, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { mockManagedClasses, type WeekDay } from './mock-classes';

export type ReservationStatus = 'confirmada' | 'en-espera' | 'asistio' | 'falto' | 'cancelada';

export const reservationStatusLabels: Record<ReservationStatus, string> = {
    confirmada: 'Confirmada',
    'en-espera': 'En espera',
    asistio: 'Asistió',
    falto: 'Faltó',
    cancelada: 'Cancelada',
};

export interface ClassSession {
    id: string;
    classId: string;
    className: string;
    trainer: string;
    /** YYYY-MM-DD (local) */
    date: string;
    /** HH:mm */
    startTime: string;
    endTime: string;
    capacity: number;
}

export interface SessionOccupancy extends ClassSession {
    booked: number;
    waitlistCount: number;
}

export interface Reservation {
    id: string;
    sessionId: string;
    memberId: string;
    memberName: string;
    status: ReservationStatus;
    /** ISO datetime; ordena la lista de espera (FIFO). */
    createdAt: string;
}

/** Vista derivada: reservas 'en-espera' de una sesión ordenadas por llegada. */
export interface WaitlistEntry {
    reservationId: string;
    memberName: string;
    position: number;
}

export interface MockMember {
    id: string;
    name: string;
}

export const MOCK_MEMBERS: MockMember[] = [
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

/**
 * "Ahora" mock: martes 10 jun 2025, 09:00. Ancla la regla de cancelación
 * tardía: Pilates (mar 18:00) queda a 9 h → tardía; el resto no.
 */
export const MOCK_NOW = new Date(2025, 5, 10, 9, 0, 0);

/** Lunes de la semana mock "actual" (9–15 jun 2025). */
const CURRENT_WEEK_START = new Date(2025, 5, 9);

/** Solo estas semanas (offsets relativos a la actual) tienen sesiones generadas. */
export const WEEK_OFFSET_MIN = -1;
export const WEEK_OFFSET_MAX = 2;

export function weekStartForOffset(offset: number): Date {
    return addWeeks(CURRENT_WEEK_START, offset);
}

export function formatWeekLabel(weekStart: Date): string {
    const end = addDays(weekStart, 6);
    return `${format(weekStart, 'd MMM', { locale: es })} – ${format(end, 'd MMM yyyy', { locale: es })}`;
}

export function sessionStartDate(session: ClassSession): Date {
    return new Date(`${session.date}T${session.startTime}:00`);
}

const DAY_INDEX: Record<WeekDay, number> = {
    Lunes: 0,
    Martes: 1,
    Miércoles: 2,
    Jueves: 3,
    Viernes: 4,
    Sábado: 5,
    Domingo: 6,
};

function endTimeFor(startTime: string, durationMin: number): string {
    const [h, m] = startTime.split(':').map(Number);
    const total = h * 60 + m + durationMin;
    return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

/** Sesiones de una semana, derivadas del horario semanal de las clases activas. */
export function buildSessionsForWeek(weekOffset: number): ClassSession[] {
    if (weekOffset < WEEK_OFFSET_MIN || weekOffset > WEEK_OFFSET_MAX) return [];
    const start = weekStartForOffset(weekOffset);
    return mockManagedClasses
        .filter((cls) => cls.status !== 'inactive')
        .map((cls) => {
            const date = format(addDays(start, DAY_INDEX[cls.day]), 'yyyy-MM-dd');
            return {
                id: `ses-${cls.id}-${date}`,
                classId: cls.id,
                className: cls.name,
                trainer: cls.trainer,
                date,
                startTime: cls.time,
                endTime: endTimeFor(cls.time, cls.durationMin),
                capacity: cls.capacity,
            };
        });
}

export const ALL_SESSIONS: ClassSession[] = Array.from(
    { length: WEEK_OFFSET_MAX - WEEK_OFFSET_MIN + 1 },
    (_, i) => WEEK_OFFSET_MIN + i,
).flatMap(buildSessionsForWeek);

export function isPastSession(session: ClassSession): boolean {
    return sessionStartDate(session).getTime() < MOCK_NOW.getTime();
}

/**
 * Reservas iniciales: la semana pasada y la actual se pueblan según
 * `booked`/`waitlistCount` de cada clase, ciclando MOCK_MEMBERS de forma
 * determinista. Las sesiones ya ocurridas (vs MOCK_NOW) quedan con el
 * resultado de asistencia (mayoría `asistio`, ~1 de cada 5 `falto`); las
 * futuras quedan `confirmada` y solo ellas siembran lista de espera.
 */
export function buildInitialReservations(): Reservation[] {
    const reservations: Reservation[] = [];
    let cursor = 0;
    const takeMember = () => MOCK_MEMBERS[cursor++ % MOCK_MEMBERS.length];
    const seededAt = (i: number) => new Date(2025, 5, 2, 9, i).toISOString();

    for (const weekOffset of [-1, 0]) {
        for (const session of buildSessionsForWeek(weekOffset)) {
            const cls = mockManagedClasses.find((c) => c.id === session.classId);
            if (!cls) continue;
            const past = isPastSession(session);
            for (let i = 0; i < cls.booked; i++) {
                const member = takeMember();
                reservations.push({
                    id: `res-${session.id}-${i}`,
                    sessionId: session.id,
                    memberId: member.id,
                    memberName: member.name,
                    status: past ? (i > 0 && i % 5 === 0 ? 'falto' : 'asistio') : 'confirmada',
                    createdAt: seededAt(reservations.length),
                });
            }
            if (past) continue;
            for (let i = 0; i < cls.waitlistCount; i++) {
                const member = takeMember();
                reservations.push({
                    id: `res-${session.id}-wl-${i}`,
                    sessionId: session.id,
                    memberId: member.id,
                    memberName: member.name,
                    status: 'en-espera',
                    createdAt: seededAt(reservations.length),
                });
            }
        }
    }

    const firstUpcoming = buildSessionsForWeek(0).find((s) => !isPastSession(s));
    if (firstUpcoming) {
        reservations.push({
            id: 'res-seed-cancelada',
            sessionId: firstUpcoming.id,
            memberId: MOCK_MEMBERS[24].id,
            memberName: MOCK_MEMBERS[24].name,
            status: 'cancelada',
            createdAt: seededAt(reservations.length),
        });
    }

    return reservations;
}
