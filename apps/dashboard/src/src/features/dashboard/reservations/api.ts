// Capa de acceso al API real de clases/sesiones/reservas (apps/restapi).
// Cada función mapea el contrato wire (inglés/UTC/ISO weekdays) al dominio en
// español que consumen los componentes. Reemplaza al viejo mock-api.ts.

import { format } from 'date-fns';
import { apiFetch } from '@/lib/api';
import { WEEK_DAYS } from './utils';
import type {
    ClassFormData,
    ClassStatus,
    GymClass,
    Reservation,
    ReservationStatus,
    SessionOccupancy,
    TrainerSummary,
    WeekDay,
} from './types';

// ── Tipos wire (subconjunto que consume el dashboard) ───────────────────────

interface ApiClassSeries {
    id: string;
    name: string;
    description: string;
    trainerId: string;
    trainerName: string;
    weekdays: number[];
    localStartTime: string;
    durationMinutes: number;
    capacity: number;
    allowWaitlist: boolean;
    startsOn: string;
    status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
    version: number;
}

interface ApiSession {
    id: string;
    classId: string;
    className: string;
    trainerId: string;
    trainerName: string;
    localDate: string;
    startTime: string;
    endTime: string;
    capacity: number;
    booked: number;
    availableSpots: number;
    status: 'SCHEDULED' | 'CANCELLED';
    version: number;
}

type ApiReservationStatus = 'CONFIRMED' | 'ATTENDED' | 'NO_SHOW' | 'CANCELLED';

interface ApiReservation {
    id: string;
    status: ApiReservationStatus;
    session: { id: string };
    createdAt: string;
}

interface ApiRosterEntry {
    reservation: ApiReservation;
    member: { id: string; name: string };
}

interface ApiMutationImpact {
    affectedSessions: number;
    affectedReservations: number;
    cancelledReservations: number;
}

// ── Mapeos wire ↔ dominio ───────────────────────────────────────────────────

/** ISO weekday (1=Lunes … 7=Domingo) ↔ nombre en español. */
const isoToWeekDay = (iso: number): WeekDay => WEEK_DAYS[iso - 1];
const weekDayToIso = (day: WeekDay): number => WEEK_DAYS.indexOf(day) + 1;

const RESERVATION_STATUS: Record<ApiReservationStatus, ReservationStatus> = {
    CONFIRMED: 'confirmada',
    ATTENDED: 'asistio',
    NO_SHOW: 'falto',
    CANCELLED: 'cancelada',
};

function toGymClass(api: ApiClassSeries): GymClass {
    return {
        id: api.id,
        name: api.name,
        description: api.description,
        trainerId: api.trainerId,
        trainerName: api.trainerName,
        days: api.weekdays.map(isoToWeekDay),
        time: api.localStartTime,
        durationMin: api.durationMinutes,
        capacity: api.capacity,
        allowWaitlist: api.allowWaitlist,
        status: api.status === 'INACTIVE' ? 'inactive' : 'active',
        version: api.version,
    };
}

function toSession(api: ApiSession): SessionOccupancy {
    return {
        id: api.id,
        classId: api.classId,
        className: api.className,
        trainerId: api.trainerId,
        trainerName: api.trainerName,
        date: api.localDate,
        startTime: api.startTime,
        endTime: api.endTime,
        capacity: api.capacity,
        status: api.status === 'CANCELLED' ? 'cancelada' : 'programada',
        version: api.version,
        booked: api.booked,
        availableSpots: api.availableSpots,
    };
}

function toReservation(entry: ApiRosterEntry): Reservation {
    return {
        id: entry.reservation.id,
        sessionId: entry.reservation.session.id,
        memberId: entry.member.id,
        memberName: entry.member.name,
        status: RESERVATION_STATUS[entry.reservation.status],
        createdAt: entry.reservation.createdAt,
    };
}

function classWriteBody(dto: ClassFormData) {
    return {
        name: dto.name,
        description: dto.description,
        trainerId: dto.trainerId,
        weekdays: dto.days.map(weekDayToIso),
        localStartTime: dto.time,
        durationMinutes: dto.durationMin,
        capacity: dto.capacity,
        allowWaitlist: dto.allowWaitlist,
        // El form no expone fecha de inicio: la serie arranca hoy (local).
        startsOn: format(new Date(), 'yyyy-MM-dd'),
    };
}

const ifMatch = (version: number): HeadersInit => ({ 'If-Match': `"${version}"` });

// ── Clases (series) ─────────────────────────────────────────────────────────

export async function fetchClasses(): Promise<GymClass[]> {
    const rows = await apiFetch<ApiClassSeries[]>('/api/v1/classes');
    return rows.map(toGymClass);
}

export async function fetchTrainers(): Promise<TrainerSummary[]> {
    return await apiFetch<TrainerSummary[]>('/api/v1/classes/trainer-options');
}

export async function createClass(dto: ClassFormData): Promise<GymClass> {
    const result = await apiFetch<{ classSeries: ApiClassSeries }>('/api/v1/classes', {
        method: 'POST',
        body: JSON.stringify({ ...classWriteBody(dto), status: dto.status === 'inactive' ? 'INACTIVE' : 'ACTIVE' }),
    });
    return toGymClass(result.classSeries);
}

export async function updateClass(
    id: string,
    dto: ClassFormData,
    version: number,
): Promise<{ classSeries: GymClass; affectedReservations: number }> {
    const result = await apiFetch<{ classSeries: ApiClassSeries; impact: ApiMutationImpact }>(`/api/v1/classes/${id}`, {
        method: 'PUT',
        headers: ifMatch(version),
        body: JSON.stringify(classWriteBody(dto)),
    });
    return { classSeries: toGymClass(result.classSeries), affectedReservations: result.impact.cancelledReservations };
}

export async function setClassStatus(
    id: string,
    status: ClassStatus,
    version: number,
): Promise<{ classSeries: GymClass; affectedReservations: number }> {
    const result = await apiFetch<{ classSeries: ApiClassSeries; impact: ApiMutationImpact }>(
        `/api/v1/classes/${id}/status`,
        {
            method: 'PUT',
            headers: ifMatch(version),
            body: JSON.stringify({ status: status === 'inactive' ? 'INACTIVE' : 'ACTIVE' }),
        },
    );
    return { classSeries: toGymClass(result.classSeries), affectedReservations: result.impact.cancelledReservations };
}

/** El backend archiva (borrado lógico): la serie desaparece del listado. */
export async function deleteClass(id: string, version: number): Promise<{ affectedReservations: number }> {
    const result = await apiFetch<{ impact: ApiMutationImpact }>(`/api/v1/classes/${id}`, {
        method: 'DELETE',
        headers: ifMatch(version),
    });
    return { affectedReservations: result.impact.cancelledReservations };
}

// ── Sesiones ────────────────────────────────────────────────────────────────

export async function fetchSessions(from: string, to: string, mine = false): Promise<SessionOccupancy[]> {
    const rows = await apiFetch<ApiSession[]>(
        `/api/v1/class-sessions?from=${from}&to=${to}&includeCancelled=true${mine ? '&mine=true' : ''}`,
    );
    return rows.map(toSession);
}

export async function fetchSession(id: string): Promise<SessionOccupancy> {
    return toSession(await apiFetch<ApiSession>(`/api/v1/class-sessions/${id}`));
}

export async function moveSession(
    id: string,
    dto: { date: string; startTime: string },
    version: number,
): Promise<void> {
    await apiFetch(`/api/v1/class-sessions/${id}/schedule`, {
        method: 'PUT',
        headers: ifMatch(version),
        body: JSON.stringify(dto),
    });
}

export async function cancelSession(id: string, version: number): Promise<{ affectedReservations: number }> {
    const result = await apiFetch<{ impact: ApiMutationImpact }>(`/api/v1/class-sessions/${id}/cancel`, {
        method: 'POST',
        headers: ifMatch(version),
    });
    return { affectedReservations: result.impact.cancelledReservations };
}

export async function fetchSessionReservations(sessionId: string): Promise<Reservation[]> {
    const rows = await apiFetch<ApiRosterEntry[]>(`/api/v1/class-sessions/${sessionId}/reservations`);
    return rows.map(toReservation);
}

// ── Reservas ────────────────────────────────────────────────────────────────

/**
 * Cancelación administrativa con reglas del miembro (MEMBER_REQUEST): dentro
 * de la ventana de 12 h el backend la registra como falto (no-show).
 */
export async function cancelReservation(id: string): Promise<{ registeredAsNoShow: boolean }> {
    const result = await apiFetch<{ registeredAsNoShow: boolean }>(`/api/v1/reservations/${id}/cancel`, {
        method: 'POST',
        body: JSON.stringify({ reason: 'MEMBER_REQUEST' }),
    });
    return { registeredAsNoShow: result.registeredAsNoShow };
}

export async function rescheduleReservation(id: string, newSessionId: string): Promise<void> {
    await apiFetch(`/api/v1/reservations/${id}/reschedule`, {
        method: 'POST',
        body: JSON.stringify({ targetSessionId: newSessionId }),
    });
}

export async function markAttendance(id: string, attended: boolean): Promise<void> {
    await apiFetch(`/api/v1/reservations/${id}/attendance`, {
        method: 'PUT',
        body: JSON.stringify({ attended }),
    });
}

export async function fetchRescheduleOptions(reservationId: string): Promise<SessionOccupancy[]> {
    const rows = await apiFetch<ApiSession[]>(`/api/v1/reservations/${reservationId}/reschedule-options`);
    return rows.map(toSession);
}
