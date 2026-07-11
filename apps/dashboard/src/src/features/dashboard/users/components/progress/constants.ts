import { format, subMonths, startOfMonth, startOfWeek, subDays } from 'date-fns';
import { es } from 'date-fns/locale';

/** Parse 'YYYY-MM-DD' as local midnight (not UTC). */
export const toLocalDate = (iso: string) => new Date(iso + 'T00:00:00');
export const METRICS = [
    { key: 'weightKg', label: 'Peso', unit: 'kg' },
    { key: 'heightCm', label: 'Altura', unit: 'cm' },
    { key: 'bodyFatPercentage', label: 'Grasa', unit: '%' },
    { key: 'waistCm', label: 'Cintura', unit: 'cm' },
] as const;

export type MetricKey = (typeof METRICS)[number]['key'];

export const MEASUREMENT_PERIODS = [
    { key: '3m', label: '3M', months: 3 },
    { key: '6m', label: '6M', months: 6 },
    { key: '1y', label: '1A', months: 12 },
    { key: 'all', label: 'Todo', months: 0 },
] as const;

export type MeasurementPeriodKey = (typeof MEASUREMENT_PERIODS)[number]['key'];

export function measurementRange(periodKey: MeasurementPeriodKey): { from?: string; to: string } {
    const today = new Date();
    const to = format(today, 'yyyy-MM-dd');
    if (periodKey === 'all') return { to };
    const { months } = MEASUREMENT_PERIODS.find((p) => p.key === periodKey)!;
    const from = format(startOfMonth(subMonths(today, months - 1)), 'yyyy-MM-dd');
    return { from, to };
}

/** A negative delta is "good" for every metric except height, which is neutral. */
export function deltaTone(value: number | null, key: MetricKey): 'good' | 'bad' | 'neutral' {
    if (value == null || value === 0 || key === 'heightCm') return 'neutral';
    return value < 0 ? 'good' : 'bad';
}

export function fmtMetric(value: string | number | null, unit: string): string {
    if (value == null || value === '') return '—';
    const n = typeof value === 'string' ? Number(value) : value;
    if (Number.isNaN(n)) return '—';
    return `${n.toLocaleString('es-CR', { maximumFractionDigits: 1 })} ${unit}`;
}

export function fmtSignedDelta(value: number | null, unit: string): string {
    if (value == null) return '—';
    const sign = value > 0 ? '+' : '';
    return `${sign}${value.toLocaleString('es-CR', { maximumFractionDigits: 1 })} ${unit}`;
}

export const ACTIVITY_METRICS = [
    { key: 'steps', label: 'Pasos' },
    { key: 'caloriesTotal', label: 'Calorías' },
    { key: 'activeMinutes', label: 'Min. activos' },
    { key: 'exerciseCount', label: 'Ejercicios' },
] as const;

export type ActivityMetricKey = (typeof ACTIVITY_METRICS)[number]['key'];

export const ACTIVITY_PERIODS = [
    { key: 'week', label: 'Semana', days: 7 },
    { key: 'month', label: 'Mes', days: 30 },
    { key: '3months', label: '3 meses', days: 90 },
] as const;

export type ActivityPeriodKey = (typeof ACTIVITY_PERIODS)[number]['key'];

export function activityRange(periodKey: ActivityPeriodKey): { from: string; to: string } {
    const today = new Date();
    const to = format(today, 'yyyy-MM-dd');
    if (periodKey === 'week') {
        return { from: format(startOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd'), to };
    }
    const { days } = ACTIVITY_PERIODS.find((p) => p.key === periodKey)!;
    return { from: format(subDays(today, days - 1), 'yyyy-MM-dd'), to };
}

export const fmtLongDate = (iso: string) => format(toLocalDate(iso), "d 'de' MMM yyyy", { locale: es });
export const fmtShortDate = (iso: string) => format(toLocalDate(iso), 'd MMM', { locale: es });
export const fmtMonth = (iso: string) => format(toLocalDate(iso), 'MMM', { locale: es });
export const fmtWeekday = (iso: string) => format(toLocalDate(iso), 'EEE', { locale: es });
