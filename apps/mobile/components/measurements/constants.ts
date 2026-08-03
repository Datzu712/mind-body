import { addDays, format, isAfter, subMonths, startOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { Ionicons } from '@expo/vector-icons';
import { FitColors as T } from '@/constants/theme';
import type { Measurement } from '@/lib/api/types/measurement';

/** Parse YYYY-MM-DD as local midnight (not UTC) */
const toDate = (iso: string) => new Date(iso + 'T00:00:00');

/**
 * Espeja `MEASUREMENT_EDIT_WINDOW_DAYS` de
 * `apps/restapi/src/modules/measurements/measurement-edit-policy.ts`. Acá solo
 * decide si se dibuja el botón de editar; quien autoriza es el API, que rechaza
 * con `MEASUREMENT_EDIT_WINDOW_EXPIRED`.
 */
export const MEASUREMENT_EDIT_WINDOW_DAYS = 7;

/** La ventana corre desde el registro (`createdAt`), no desde la fecha medida. */
export function isEditable(measurement: Measurement, now: Date = new Date()): boolean {
    const limit = addDays(new Date(measurement.createdAt), MEASUREMENT_EDIT_WINDOW_DAYS);
    return !isAfter(now, limit);
}

/** El API iguala ambos timestamps al crear, así que difieren solo si se corrigió. */
export function wasEdited(measurement: Measurement): boolean {
    return new Date(measurement.updatedAt).getTime() > new Date(measurement.createdAt).getTime();
}

export const METRICS = [
    { key: 'weightKg' as const, label: 'Peso', unit: 'kg', icon: 'scale-outline' as const, step: 0.1 },
    { key: 'heightCm' as const, label: 'Altura', unit: 'cm', icon: 'resize-outline' as const, step: 0.5 },
    { key: 'bodyFatPercentage' as const, label: 'Grasa', unit: '%', icon: 'water-outline' as const, step: 0.1 },
    { key: 'waistCm' as const, label: 'Cintura', unit: 'cm', icon: 'ellipse-outline' as const, step: 0.5 },
];

export const PERIODS = [
    { key: '3m', label: '3M', months: 3 },
    { key: '6m', label: '6M', months: 6 },
    { key: '1y', label: '1A', months: 12 },
    { key: 'all', label: 'Todo', months: 0 },
] as const;

export type MetricKey = (typeof METRICS)[number]['key'];
export type PeriodKey = (typeof PERIODS)[number]['key'];

export function formatDate(iso: string): string {
    return format(toDate(iso), "d 'de' MMM yyyy", { locale: es });
}

export function shortDate(iso: string): string {
    return format(toDate(iso), 'd MMM', { locale: es });
}

export function monthLabel(iso: string): string {
    return format(toDate(iso), 'MMM', { locale: es });
}

export function getDateRange(periodKey: PeriodKey): { from?: string; to: string } {
    const today = new Date();
    const to = format(today, 'yyyy-MM-dd');
    if (periodKey === 'all') return { to };
    const { months } = PERIODS.find((p) => p.key === periodKey)!;
    const from = format(startOfMonth(subMonths(today, months - 1)), 'yyyy-MM-dd');
    return { from, to };
}

export function deltaColor(value: number | null, key: MetricKey): string {
    if (value == null || value === 0) return T.muted;
    if (key === 'heightCm') return T.muted;
    return value < 0 ? T.green : T.red;
}

export function deltaIcon(value: number | null, key: MetricKey): keyof typeof Ionicons.glyphMap {
    if (value == null || value === 0) return 'remove-outline';
    if (key === 'heightCm') return 'remove-outline';
    return value < 0 ? 'arrow-down' : 'arrow-up';
}
