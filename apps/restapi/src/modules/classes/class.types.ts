// Contratos del API de clases (series recurrentes; sección 9 del plan
// docs/superpowers/plans/2026-07-15-restapi-classes-reservations.md).
// Valores estables en inglés/uppercase; las etiquetas españolas son del cliente.

export type ClassSeriesStatus = 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
export type ClassLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export interface ClassSeriesDto {
    id: string;
    name: string;
    description: string;
    trainerId: string;
    trainerName: string;
    /** ISO: lunes=1 … domingo=7, ordenados. */
    weekdays: number[];
    /** HH:mm en BUSINESS_TIME_ZONE. */
    localStartTime: string;
    durationMinutes: number;
    capacity: number;
    allowWaitlist: boolean;
    /** YYYY-MM-DD local. */
    startsOn: string;
    category: string | null;
    level: ClassLevel | null;
    room: string | null;
    zone: string | null;
    status: ClassSeriesStatus;
    version: number;
    createdAt: string;
    updatedAt: string;
}

export interface TrainerSummary {
    id: string;
    name: string;
}

export interface MutationImpact {
    affectedSessions: number;
    /** Reservas activas (CONFIRMED) ligadas a las sesiones cambiadas. */
    affectedReservations: number;
    cancelledReservations: number;
}

export interface ClassMutationResult {
    classSeries: ClassSeriesDto;
    impact: MutationImpact;
}
