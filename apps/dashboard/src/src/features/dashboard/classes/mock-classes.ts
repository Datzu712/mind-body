// Mock data for the Reservations module — Dashboard (HU-RES-004 / HU-RES-005).
//
// ⚠️ FRONTEND MOCK — no backend, no HTTP, no Drizzle. Local data + local state only.
// Types are shaped to mirror future API DTOs so they can be swapped for react-query
// hooks against `apps/restapi` with minimal churn.

import { format, setDay, subWeeks } from 'date-fns';

// ── Trainer agenda (HU-RES-004) ────────────────────────────────────────────────

export type TrainerSessionStatus = 'confirmada' | 'reprogramada' | 'en-espera' | 'cancelacion-tardia' | 'cancelada';

export interface TrainerSession {
    id: string;
    time: string;
    className: string;
    member: string;
    status: TrainerSessionStatus;
}

export const trainerSessionStatusLabels: Record<TrainerSessionStatus, string> = {
    confirmada: 'Confirmada',
    reprogramada: 'Reprogramada',
    'en-espera': 'En espera',
    'cancelacion-tardia': 'Cancelación tardía',
    cancelada: 'Cancelada',
};

export const mockTrainerSessions: TrainerSession[] = [
    { id: 'ses-1', time: '07:00 - 08:00', className: 'Yoga Flow', member: 'María López', status: 'confirmada' },
    { id: 'ses-2', time: '08:00 - 09:00', className: 'HIIT Power', member: 'Juan Pérez', status: 'confirmada' },
    { id: 'ses-3', time: '10:00 - 11:00', className: 'Funcional', member: 'Ana Torres', status: 'reprogramada' },
    { id: 'ses-4', time: '11:00 - 12:00', className: 'Spinning', member: 'Luis García', status: 'en-espera' },
    { id: 'ses-5', time: '13:00 - 14:00', className: 'Pilates', member: 'Sofía Ramírez', status: 'cancelacion-tardia' },
    { id: 'ses-6', time: '17:00 - 18:00', className: 'HIIT Power', member: 'Carlos Díaz', status: 'cancelada' },
];

/** Summary metrics for the agenda header cards. */
export const agendaMetrics = {
    reservasHoy: 12,
    proximasSesiones: 5,
    canceladasHoy: 2,
};

/** Static day label used by the date filter (mock, no real calendar). */
export const AGENDA_TODAY_LABEL = 'Hoy, 9 jun 2025';

// ── Class management (HU-RES-005) ──────────────────────────────────────────────

export type ClassStatus = 'active' | 'inactive' | 'full' | 'waitlist';

export type WeekDay = 'Lunes' | 'Martes' | 'Miércoles' | 'Jueves' | 'Viernes' | 'Sábado' | 'Domingo';

export interface ManagedClass {
    id: string;
    name: string;
    description: string;
    trainer: string;
    day: WeekDay;
    time: string;
    durationMin: number;
    capacity: number;
    booked: number;
    waitlistCount: number;
    allowWaitlist: boolean;
    status: ClassStatus;
    /** Active reservations tied to this class — drives the delete/deactivate warning. */
    activeReservations: number;
}

export const classStatusLabels: Record<ClassStatus, string> = {
    active: 'Activa',
    inactive: 'Inactiva',
    full: 'Cupo lleno',
    waitlist: 'Lista de espera',
};

export const WEEK_DAYS: WeekDay[] = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

export const MOCK_TRAINERS: string[] = ['Ana Pérez', 'Carlos Ruiz', 'Luis García', 'Juan López', 'Sofía Ramírez'];

export const mockManagedClasses: ManagedClass[] = [
    {
        id: 'cls-1',
        name: 'Yoga Flow',
        description: 'Secuencias fluidas de yoga para flexibilidad y calma.',
        trainer: 'Ana Pérez',
        day: 'Lunes',
        time: '07:00',
        durationMin: 60,
        capacity: 10,
        booked: 8,
        waitlistCount: 0,
        allowWaitlist: true,
        status: 'active',
        activeReservations: 8,
    },
    {
        id: 'cls-2',
        name: 'HIIT Power',
        description: 'Clase de alta intensidad para quemar grasa.',
        trainer: 'Carlos Ruiz',
        day: 'Lunes',
        time: '08:00',
        durationMin: 45,
        capacity: 10,
        booked: 2,
        waitlistCount: 0,
        allowWaitlist: false,
        status: 'active',
        activeReservations: 2,
    },
    {
        id: 'cls-3',
        name: 'Spinning',
        description: 'Ciclismo indoor de alta energía con intervalos.',
        trainer: 'Luis García',
        day: 'Lunes',
        time: '09:00',
        durationMin: 45,
        capacity: 10,
        booked: 10,
        waitlistCount: 4,
        allowWaitlist: true,
        status: 'full',
        activeReservations: 10,
    },
    {
        id: 'cls-4',
        name: 'Funcional',
        description: 'Entrenamiento funcional de fuerza y movilidad.',
        trainer: 'Juan López',
        day: 'Lunes',
        time: '10:00',
        durationMin: 60,
        capacity: 12,
        booked: 5,
        waitlistCount: 0,
        allowWaitlist: true,
        status: 'active',
        activeReservations: 5,
    },
    {
        id: 'cls-5',
        name: 'Pilates',
        description: 'Trabajo de core y estabilidad con movimientos controlados.',
        trainer: 'Sofía Ramírez',
        day: 'Martes',
        time: '18:00',
        durationMin: 50,
        capacity: 12,
        booked: 4,
        waitlistCount: 0,
        allowWaitlist: false,
        status: 'active',
        activeReservations: 4,
    },
    {
        id: 'cls-6',
        name: 'Zumba',
        description: 'Baile fitness para cardio y diversión.',
        trainer: 'Ana Pérez',
        day: 'Miércoles',
        time: '19:00',
        durationMin: 60,
        capacity: 20,
        booked: 20,
        waitlistCount: 6,
        allowWaitlist: true,
        status: 'waitlist',
        activeReservations: 20,
    },
    {
        id: 'cls-7',
        name: 'Body Pump',
        description: 'Fuerza con barra y peso libre en grupo.',
        trainer: 'Carlos Ruiz',
        day: 'Jueves',
        time: '20:00',
        durationMin: 55,
        capacity: 15,
        booked: 0,
        waitlistCount: 0,
        allowWaitlist: false,
        status: 'inactive',
        activeReservations: 0,
    },
];

// ── Class session history (per-series past sessions) ───────────────────────────

export type ClassSessionStatus = 'realizada' | 'cancelada' | 'reprogramada' | 'movida';

export interface ClassSession {
    id: string;
    classId: string; // ManagedClass.id
    date: string; // ISO 'yyyy-mm-dd', always <= today
    time: string; // 'HH:mm'
    status: ClassSessionStatus;
    trainer: string; // who taught it (may differ from ManagedClass.trainer)
    capacity: number;
    reservations: number;
    attended: number;
    noShow: number;
}

export const classSessionStatusLabels: Record<ClassSessionStatus, string> = {
    realizada: 'Realizada',
    cancelada: 'Cancelada',
    reprogramada: 'Reprogramada',
    movida: 'Movida',
};

const WEEK_DAY_TO_INDEX: Record<WeekDay, number> = {
    Domingo: 0,
    Lunes: 1,
    Martes: 2,
    Miércoles: 3,
    Jueves: 4,
    Viernes: 5,
    Sábado: 6,
};

const CLASS_SESSION_STATUS_CYCLE: ClassSessionStatus[] = ['realizada', 'cancelada', 'reprogramada', 'movida'];

// ponytail: deterministic (no Math.random); cls-1 spans 24w so pagination > 20 rows; past-only.
export function generateClassSessions(classes: ManagedClass[]): ClassSession[] {
    const sessions: ClassSession[] = [];
    const now = new Date();

    for (const cls of classes) {
        const weeksBack = cls.id === 'cls-1' ? 24 : 12;
        const dayIndex = WEEK_DAY_TO_INDEX[cls.day];

        for (let i = 0; i < weeksBack; i += 1) {
            const anchor = subWeeks(now, i);
            const candidate = setDay(anchor, dayIndex);
            if (candidate.getTime() > now.getTime()) continue;

            const status = CLASS_SESSION_STATUS_CYCLE[i % CLASS_SESSION_STATUS_CYCLE.length];
            const isCancelled = status === 'cancelada';
            const reservations = isCancelled ? 0 : Math.max(0, cls.capacity - (i % 3));
            const attended = isCancelled ? 0 : Math.max(0, reservations - (i % 2));
            const noShow = isCancelled ? 0 : Math.max(0, reservations - attended);
            const trainer = MOCK_TRAINERS[(i + sessions.length) % MOCK_TRAINERS.length];

            sessions.push({
                id: `cs-${cls.id}-${i}`,
                classId: cls.id,
                date: format(candidate, 'yyyy-MM-dd'),
                time: cls.time,
                status,
                trainer,
                capacity: cls.capacity,
                reservations,
                attended,
                noShow,
            });
        }
    }

    return sessions;
}
