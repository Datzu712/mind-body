import type { ClassSessionStatus } from '@/modules/class-sessions/session.types';

// WAITLISTED existe en la BD pero la funcionalidad de espera NO está en v1 (solo el flag allowWaitlist).
export type ReservationStatus = 'CONFIRMED' | 'ATTENDED' | 'NO_SHOW' | 'CANCELLED';

export type ReservationReason =
    | 'MEMBER_BOOKED'
    | 'MEMBER_CANCELLED'
    | 'ADMIN_CANCELLED'
    | 'LATE_CANCELLATION'
    | 'SESSION_CANCELLED'
    | 'SERIES_CHANGED'
    | 'RESCHEDULED'
    | 'ATTENDANCE';

export interface ReservationSessionDto {
    id: string;
    classId: string;
    className: string;
    trainerId: string;
    trainerName: string;
    startsAt: string;
    endsAt: string;
    status: ClassSessionStatus;
    room: string | null;
    zone: string | null;
}

export interface ReservationDto {
    id: string;
    status: ReservationStatus;
    statusReason: ReservationReason;
    session: ReservationSessionDto;
    rescheduledFromReservationId: string | null;
    confirmedAt: string | null;
    cancelledAt: string | null;
    attendanceMarkedAt: string | null;
    createdAt: string;
    updatedAt: string;
}

/** Roster/espera administrativos; los endpoints self nunca exponen otros miembros. */
export interface SessionMemberEntryDto {
    reservation: ReservationDto;
    member: { id: string; name: string };
}

export interface CancelReservationResult {
    reservation: ReservationDto;
    changed: boolean;
    registeredAsNoShow: boolean;
}

export interface DomainWarning {
    code: 'MEMBER_TIME_CONFLICT';
    details: { conflictingSessionIds: string[] };
}

export interface ReservationMutationResult {
    reservation: ReservationDto;
    changed: boolean;
    warnings: DomainWarning[];
}
