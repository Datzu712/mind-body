/**
 * Mock data + types for the Reservations module (frontend-only).
 *
 * ⚠️ FRONTEND MOCK — no backend, no HTTP, no Drizzle. Everything here is local
 * and designed to mirror the shape of a future API DTO so it can be swapped for
 * `@tanstack/react-query` hooks against `apps/restapi` with minimal churn.
 */

import { FitColors as T } from '@/constants/theme';

// ── Types ─────────────────────────────────────────────────────────────────────

export type ClassLevel = 'Bajo' | 'Medio' | 'Alto';

/** Bookable categories. `Todas` is only used as a filter chip, never on a class. */
export type ClassCategory = 'Yoga' | 'Fuerza' | 'Cardio' | 'Mind';
export type FilterCategory = 'Todas' | ClassCategory;

export type ReservationStatus = 'confirmada' | 'reprogramada' | 'cancelacion-tardia' | 'cancelada';

export type WaitlistStatus = 'en-espera' | 'cupo-asignado' | 'cerrada';

export type ReminderAnticipation = '15min' | '1h' | '24h' | '1d';

export type GymClass = {
    id: string;
    name: string;
    trainer: string;
    /** Human label, e.g. "07:00 - 08:00". */
    time: string;
    durationMin: number;
    level: ClassLevel;
    category: ClassCategory;
    room: string;
    zone: string;
    capacity: number;
    /** Derived UI rules: 0 → sin cupos (waitlist); 1-2 → "pocos cupos" warning. */
    spotsLeft: number;
    description: string;
    /** Accent color used for the card's top bar / category chip. */
    accent: string;
    /** Mock flag: this class overlaps with an existing reservation. */
    hasConflict?: boolean;
};

export type UserReservation = {
    id: string;
    class: GymClass;
    /** Human label, e.g. "Lun 9 Jun". */
    dateLabel: string;
    status: ReservationStatus;
    /** Mock flag: true → cancellation falls inside the allowed window (no penalty). */
    cancelableInWindow: boolean;
};

export type WaitlistEntry = {
    id: string;
    class: GymClass;
    /** Current position in the queue (1-based). Ignored when status !== 'en-espera'. */
    position: number;
    status: WaitlistStatus;
};

export type ReminderPrefs = {
    push: boolean;
    email: boolean;
    anticipation: ReminderAnticipation;
};

// ── Derived helpers ─────────────────────────────────────────────────────────────

export const LOW_SPOTS_THRESHOLD = 2;

export const hasNoSpots = (c: GymClass) => c.spotsLeft <= 0;
export const hasLowSpots = (c: GymClass) => c.spotsLeft > 0 && c.spotsLeft <= LOW_SPOTS_THRESHOLD;

// ── Mock catalog ────────────────────────────────────────────────────────────────

export const FILTER_CATEGORIES: FilterCategory[] = ['Todas', 'Yoga', 'Fuerza', 'Cardio', 'Mind'];

export const MOCK_CLASSES: GymClass[] = [
    {
        id: 'hiit-power',
        name: 'HIIT Power',
        trainer: 'Carlos Ruiz',
        time: '07:00 - 08:00',
        durationMin: 60,
        level: 'Alto',
        category: 'Fuerza',
        room: 'Sala 1',
        zone: 'Functional Zone',
        capacity: 20,
        spotsLeft: 8,
        description:
            'Entrenamiento interválico de alta intensidad para mejorar tu resistencia y fuerza en menos tiempo.',
        accent: T.orange,
        hasConflict: true,
    },
    {
        id: 'vinyasa-flow',
        name: 'Vinyasa Flow',
        trainer: 'Ana Pérez',
        time: '08:30 - 09:30',
        durationMin: 60,
        level: 'Medio',
        category: 'Yoga',
        room: 'Sala 2',
        zone: 'Mind Studio',
        capacity: 15,
        spotsLeft: 2,
        description: 'Secuencias fluidas que conectan respiración y movimiento para ganar flexibilidad y calma.',
        accent: T.purple,
    },
    {
        id: 'spinning-ride',
        name: 'Spinning',
        trainer: 'Juan López',
        time: '10:00 - 11:00',
        durationMin: 60,
        level: 'Alto',
        category: 'Cardio',
        room: 'Cycling Studio',
        zone: 'Cardio Zone',
        capacity: 24,
        spotsLeft: 0,
        description:
            'Rodada indoor con intervalos de sprint y escalada al ritmo de la música. Quema calorías sin parar.',
        accent: T.blue,
    },
    {
        id: 'pilates-core',
        name: 'Pilates Core',
        trainer: 'Sofía Ramírez',
        time: '11:30 - 12:30',
        durationMin: 60,
        level: 'Bajo',
        category: 'Fuerza',
        room: 'Sala 3',
        zone: 'Functional Zone',
        capacity: 16,
        spotsLeft: 10,
        description: 'Trabajo de core y estabilidad con movimientos controlados. Ideal para postura y fuerza profunda.',
        accent: T.green,
    },
    {
        id: 'mindful-breath',
        name: 'Mindful Breath',
        trainer: 'Lucía Gómez',
        time: '18:00 - 18:45',
        durationMin: 45,
        level: 'Bajo',
        category: 'Mind',
        room: 'Mind Studio',
        zone: 'Mind Studio',
        capacity: 18,
        spotsLeft: 6,
        description: 'Meditación guiada y ejercicios de respiración para reducir el estrés y cerrar bien tu día.',
        accent: T.blue,
    },
];

export const getClassById = (id?: string | string[]): GymClass => {
    const key = Array.isArray(id) ? id[0] : id;
    return MOCK_CLASSES.find((c) => c.id === key) ?? MOCK_CLASSES[0];
};

const byId = (id: string) => MOCK_CLASSES.find((c) => c.id === id) as GymClass;

// ── Mock user reservations ──────────────────────────────────────────────────────

export const MOCK_UPCOMING: UserReservation[] = [
    {
        id: 'res-1',
        class: byId('hiit-power'),
        dateLabel: 'Lun 9 Jun',
        status: 'confirmada',
        cancelableInWindow: true,
    },
    {
        id: 'res-2',
        class: byId('vinyasa-flow'),
        dateLabel: 'Mar 10 Jun',
        status: 'reprogramada',
        cancelableInWindow: true,
    },
    {
        id: 'res-3',
        class: byId('spinning-ride'),
        dateLabel: 'Mié 11 Jun',
        status: 'confirmada',
        // Starts soon → out of the cancellation window (late-cancel penalty).
        cancelableInWindow: false,
    },
];

export const MOCK_HISTORY: UserReservation[] = [
    {
        id: 'his-1',
        class: byId('pilates-core'),
        dateLabel: 'Vie 6 Jun',
        status: 'cancelada',
        cancelableInWindow: true,
    },
    {
        id: 'his-2',
        class: byId('spinning-ride'),
        dateLabel: 'Jue 5 Jun',
        status: 'cancelacion-tardia',
        cancelableInWindow: false,
    },
    {
        id: 'his-3',
        class: byId('hiit-power'),
        dateLabel: 'Lun 2 Jun',
        status: 'confirmada',
        cancelableInWindow: true,
    },
];

// ── Mock waitlist ────────────────────────────────────────────────────────────────

export const MOCK_WAITLIST: WaitlistEntry[] = [
    {
        id: 'wl-1',
        class: byId('spinning-ride'),
        position: 3,
        status: 'en-espera',
    },
    {
        id: 'wl-2',
        class: { ...byId('vinyasa-flow'), name: 'Cycling', time: '10:00 - 11:00', room: 'Cycling Studio' },
        position: 0,
        status: 'cupo-asignado',
    },
    {
        id: 'wl-3',
        class: byId('pilates-core'),
        position: 0,
        status: 'cerrada',
    },
];

// ── Mock reminder preferences ───────────────────────────────────────────────────

export const DEFAULT_REMINDER_PREFS: ReminderPrefs = {
    push: true,
    email: true,
    anticipation: '1h',
};

export const ANTICIPATION_OPTIONS: { value: ReminderAnticipation; label: string }[] = [
    { value: '15min', label: '15 min' },
    { value: '1h', label: '1 hora' },
    { value: '24h', label: '24 horas' },
    { value: '1d', label: '1 día' },
];
