// Contratos del API de sesiones materializadas (sección 9 del plan
// docs/superpowers/plans/2026-07-15-restapi-classes-reservations.md).

import type { ClassLevel, MutationImpact } from '@/modules/classes/class.types';
import type { ReservationStatus } from '@/modules/reservations/reservation.types';

export type ClassSessionStatus = 'SCHEDULED' | 'CANCELLED';

export interface SessionViewer {
    /** Fila vigente (no cancelada) del miembro autenticado, si existe. */
    reservationId: string | null;
    reservationStatus: ReservationStatus | null;
    hasConflict: boolean;
}

export interface SessionDto {
    id: string;
    classId: string;
    className: string;
    description: string;
    trainerId: string;
    trainerName: string;
    /** Fecha local de la ocurrencia original (inmutable ante moves). */
    originDate: string;
    startsAt: string;
    endsAt: string;
    timeZone: string;
    /** Proyección local real de startsAt/endsAt en BUSINESS_TIME_ZONE. */
    localDate: string;
    startTime: string;
    endTime: string;
    capacity: number;
    /** Ocupados: CONFIRMED + ATTENDED + NO_SHOW. */
    booked: number;
    /** Disponibles: max(capacity - booked, 0). */
    availableSpots: number;
    /** Solo flag informativo en v1: la funcionalidad de espera no existe aún. */
    allowWaitlist: boolean;
    status: ClassSessionStatus;
    scheduleOverridden: boolean;
    category: string | null;
    level: ClassLevel | null;
    room: string | null;
    zone: string | null;
    version: number;
    /** Solo se calcula para requests self-scoped de MEMBER; null para el resto. */
    viewer: SessionViewer | null;
}

export interface SessionMutationResult {
    session: SessionDto;
    impact: MutationImpact;
    changed: boolean;
}
