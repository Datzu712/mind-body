import { useMemo, useState } from 'react';
import {
    ALL_SESSIONS,
    buildInitialReservations,
    buildSessionsForWeek,
    MOCK_NOW,
    sessionStartDate,
    type ClassSession,
    type Reservation,
    type ReservationStatus,
    type SessionOccupancy,
    type WaitlistEntry,
} from './mock-reservations';

/** Ocupan cupo: reservas vigentes y resultados de asistencia (el cupo se usó). */
const ACTIVE_STATUSES: readonly ReservationStatus[] = ['confirmada', 'asistio', 'falto'];
const LATE_CANCEL_WINDOW_MS = 12 * 60 * 60 * 1000;

export interface ReservationsStore {
    reservations: Reservation[];
    sessionById: Map<string, ClassSession>;
    getSessionsForWeek: (weekOffset: number) => SessionOccupancy[];
    getOccupancy: (sessionId: string) => SessionOccupancy | undefined;
    /** Reservas visibles en el panel de sesión (todas menos las 'en-espera'). */
    getSessionReservations: (sessionId: string) => Reservation[];
    getWaitlist: (sessionId: string) => WaitlistEntry[];
    isLateCancellation: (reservationId: string) => boolean;
    /** Cancelación tardía (<12 h antes del inicio) cuenta como 'falto'. */
    cancelReservation: (reservationId: string) => void;
    rescheduleReservation: (reservationId: string, newSessionId: string) => void;
    /** Check-in de una sesión pasada: marca 'asistio' o 'falto'. */
    markAttendance: (reservationId: string, attended: boolean) => void;
    promoteFromWaitlist: (reservationId: string) => { ok: boolean; error?: string };
    removeFromWaitlist: (reservationId: string) => void;
}

/**
 * Estado mock del módulo de reservas. Instanciar UNA sola vez (en la ruta) y
 * compartir por props para que las mutaciones se reflejen en todos los tabs.
 * Sin persistencia: recargar la página resetea todo.
 */
export function useReservationsMock(): ReservationsStore {
    const [reservations, setReservations] = useState<Reservation[]>(buildInitialReservations);

    const sessionById = useMemo(() => new Map(ALL_SESSIONS.map((s) => [s.id, s])), []);

    const countFor = (sessionId: string, statuses: readonly ReservationStatus[]) =>
        reservations.filter((r) => r.sessionId === sessionId && statuses.includes(r.status)).length;

    const enrich = (session: ClassSession): SessionOccupancy => ({
        ...session,
        booked: countFor(session.id, ACTIVE_STATUSES),
        waitlistCount: countFor(session.id, ['en-espera']),
    });

    const getSessionsForWeek = (weekOffset: number) => buildSessionsForWeek(weekOffset).map(enrich);

    const getOccupancy = (sessionId: string) => {
        const session = sessionById.get(sessionId);
        return session ? enrich(session) : undefined;
    };

    const getSessionReservations = (sessionId: string) =>
        reservations.filter((r) => r.sessionId === sessionId && r.status !== 'en-espera');

    const getWaitlist = (sessionId: string): WaitlistEntry[] =>
        reservations
            .filter((r) => r.sessionId === sessionId && r.status === 'en-espera')
            .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
            .map((r, i) => ({ reservationId: r.id, memberName: r.memberName, position: i + 1 }));

    const isLateCancellation = (reservationId: string) => {
        const reservation = reservations.find((r) => r.id === reservationId);
        const session = reservation && sessionById.get(reservation.sessionId);
        if (!session) return false;
        const untilStart = sessionStartDate(session).getTime() - MOCK_NOW.getTime();
        return untilStart > 0 && untilStart < LATE_CANCEL_WINDOW_MS;
    };

    const setStatus = (reservationId: string, status: ReservationStatus) =>
        setReservations((prev) => prev.map((r) => (r.id === reservationId ? { ...r, status } : r)));

    const cancelReservation = (reservationId: string) =>
        setStatus(reservationId, isLateCancellation(reservationId) ? 'falto' : 'cancelada');

    const rescheduleReservation = (reservationId: string, newSessionId: string) =>
        setReservations((prev) =>
            prev.map((r) => (r.id === reservationId ? { ...r, sessionId: newSessionId, status: 'confirmada' } : r)),
        );

    const markAttendance = (reservationId: string, attended: boolean) =>
        setStatus(reservationId, attended ? 'asistio' : 'falto');

    const promoteFromWaitlist = (reservationId: string) => {
        const reservation = reservations.find((r) => r.id === reservationId);
        if (!reservation) return { ok: false, error: 'Reserva no encontrada' };
        const occupancy = getOccupancy(reservation.sessionId);
        if (!occupancy || occupancy.booked >= occupancy.capacity) {
            return { ok: false, error: 'La sesión no tiene cupo disponible' };
        }
        setStatus(reservationId, 'confirmada');
        return { ok: true };
    };

    const removeFromWaitlist = (reservationId: string) => setStatus(reservationId, 'cancelada');

    return {
        reservations,
        sessionById,
        getSessionsForWeek,
        getOccupancy,
        getSessionReservations,
        getWaitlist,
        isLateCancellation,
        cancelReservation,
        rescheduleReservation,
        markAttendance,
        promoteFromWaitlist,
        removeFromWaitlist,
    };
}
