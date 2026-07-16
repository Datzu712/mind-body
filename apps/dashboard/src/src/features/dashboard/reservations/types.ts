// Tipos de dominio del módulo Reservas/Clases (lado dashboard).
// Son la proyección en español del contrato REST de apps/restapi; el mapeo
// wire ↔ dominio vive en api.ts.

export type WeekDay = 'Lunes' | 'Martes' | 'Miércoles' | 'Jueves' | 'Viernes' | 'Sábado' | 'Domingo';

export type ClassStatus = 'active' | 'inactive';

/** Serie/plantilla: define la recurrencia; el backend la materializa en sesiones. */
export interface GymClass {
    id: string;
    name: string;
    description: string;
    trainerId: string;
    trainerName: string;
    /** Recurrencia semanal multi-día. */
    days: WeekDay[];
    /** HH:mm (hora local del negocio) */
    time: string;
    durationMin: number;
    capacity: number;
    allowWaitlist: boolean;
    status: ClassStatus;
    /** Concurrencia optimista: viaja como If-Match en las mutaciones. */
    version: number;
}

export interface ClassFormData {
    name: string;
    description: string;
    trainerId: string;
    days: WeekDay[];
    time: string;
    durationMin: number;
    capacity: number;
    allowWaitlist: boolean;
    status: ClassStatus;
}

export interface TrainerSummary {
    id: string;
    name: string;
}

export type SessionStatus = 'programada' | 'cancelada';

/** Sesión materializada: fila propia, movible/cancelable independiente de la serie. */
export interface ClassSession {
    id: string;
    classId: string;
    className: string;
    trainerId: string;
    trainerName: string;
    /** YYYY-MM-DD (local del negocio) */
    date: string;
    /** HH:mm */
    startTime: string;
    endTime: string;
    capacity: number;
    status: SessionStatus;
    version: number;
}

export interface SessionOccupancy extends ClassSession {
    booked: number;
    availableSpots: number;
}

// La lista de espera no existe en v1 (solo el flag allowWaitlist de la serie).
export type ReservationStatus = 'confirmada' | 'asistio' | 'falto' | 'cancelada';

export interface Reservation {
    id: string;
    sessionId: string;
    memberId: string;
    memberName: string;
    status: ReservationStatus;
    createdAt: string;
}
