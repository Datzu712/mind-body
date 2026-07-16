// Helpers puros de fechas/formato — no dependen del mock; sobreviven al switch
// de backend tal cual.

import { addDays, addWeeks, format, startOfWeek } from 'date-fns';
import { es } from 'date-fns/locale';
import type { ClassSession, GymClass, WeekDay } from './types';

export const WEEK_DAYS: WeekDay[] = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

export const DAY_INDEX: Record<WeekDay, number> = {
    Lunes: 0,
    Martes: 1,
    Miércoles: 2,
    Jueves: 3,
    Viernes: 4,
    Sábado: 5,
    Domingo: 6,
};

const DAY_ABBREV: Record<WeekDay, string> = {
    Lunes: 'Lun',
    Martes: 'Mar',
    Miércoles: 'Mié',
    Jueves: 'Jue',
    Viernes: 'Vie',
    Sábado: 'Sáb',
    Domingo: 'Dom',
};

/** La semana "actual" es la semana real en curso (lunes como inicio). */
const CURRENT_WEEK_START = startOfWeek(new Date(), { weekStartsOn: 1 });

/** Solo estas semanas (offsets relativos a la actual) tienen sesiones materializadas. */
export const WEEK_OFFSET_MIN = -1;
export const WEEK_OFFSET_MAX = 2;

export function weekStartForOffset(offset: number): Date {
    return addWeeks(CURRENT_WEEK_START, offset);
}

export function formatWeekLabel(weekStart: Date): string {
    const end = addDays(weekStart, 6);
    return `${format(weekStart, 'd MMM', { locale: es })} – ${format(end, 'd MMM yyyy', { locale: es })}`;
}

export function sessionStartDate(session: Pick<ClassSession, 'date' | 'startTime'>): Date {
    return new Date(`${session.date}T${session.startTime}:00`);
}

export function isPastSession(session: Pick<ClassSession, 'date' | 'startTime'>): boolean {
    return sessionStartDate(session).getTime() < Date.now();
}

const LATE_CANCEL_WINDOW_MS = 12 * 60 * 60 * 1000;

/** Cancelación tardía: la sesión inicia en menos de 12 h (contra la hora real). */
export function isLateCancellation(session: Pick<ClassSession, 'date' | 'startTime'>): boolean {
    const untilStart = sessionStartDate(session).getTime() - Date.now();
    return untilStart > 0 && untilStart < LATE_CANCEL_WINDOW_MS;
}

/** Día de la semana (Lunes..Domingo) de una fecha YYYY-MM-DD local. */
export function weekDayOf(date: string): WeekDay {
    const jsDay = new Date(`${date}T00:00:00`).getDay(); // 0 = domingo
    return WEEK_DAYS[(jsDay + 6) % 7];
}

/** '18:30' → '6:30 p. m.' · '07:00' → '7 a. m.' */
export function formatTime12h(time: string): string {
    const [h, m] = time.split(':').map(Number);
    const suffix = h < 12 ? 'a. m.' : 'p. m.';
    const hour = h % 12 === 0 ? 12 : h % 12;
    return m > 0 ? `${hour}:${String(m).padStart(2, '0')} ${suffix}` : `${hour} ${suffix}`;
}

export function endTimeFor(startTime: string, durationMin: number): string {
    const [h, m] = startTime.split(':').map(Number);
    const total = h * 60 + m + durationMin;
    return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

/** "Lun, Mié, Vie · 6 a. m. · 50 min" */
export function formatScheduleLabel(cls: Pick<GymClass, 'days' | 'time' | 'durationMin'>): string {
    const days = [...cls.days]
        .sort((a, b) => DAY_INDEX[a] - DAY_INDEX[b])
        .map((d) => DAY_ABBREV[d])
        .join(', ');
    return `${days} · ${formatTime12h(cls.time)} · ${cls.durationMin} min`;
}
