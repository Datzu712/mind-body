// Tipos de dominio del módulo Reservas/Clases.
// Imitan los futuros DTOs del API — acá no vive nada exclusivo del mock.

export type WeekDay = 'Lunes' | 'Martes' | 'Miércoles' | 'Jueves' | 'Viernes' | 'Sábado' | 'Domingo';

export type ClassStatus = 'active' | 'inactive';

/** Serie/plantilla: define la recurrencia; el cron la materializa en sesiones. */
export interface GymClass {
    id: string;
    name: string;
    description: string;
    trainer: string;
    /** Recurrencia semanal multi-día. */
    days: WeekDay[];
    /** HH:mm */
    time: string;
    durationMin: number;
    capacity: number;
    allowWaitlist: boolean;
    status: ClassStatus;
}

export type ClassFormData = Omit<GymClass, 'id'>;

export type SessionStatus = 'programada' | 'cancelada';

/** Sesión materializada: fila propia, movible/cancelable independiente de la serie. */
export interface ClassSession {
    id: string;
    classId: string;
    className: string;
    trainer: string;
    /** YYYY-MM-DD (local) — propia de la sesión, editable */
    date: string;
    /** HH:mm — propia de la sesión, editable */
    startTime: string;
    endTime: string;
    capacity: number;
    status: SessionStatus;
}

export interface SessionOccupancy extends ClassSession {
    booked: number;
    waitlistCount: number;
}

export type ReservationStatus = 'confirmada' | 'en-espera' | 'asistio' | 'falto' | 'cancelada';

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
