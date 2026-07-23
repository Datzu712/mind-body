import { format, subMonths, startOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { Ionicons } from '@expo/vector-icons';
import { FitColors as T } from '@/constants/theme';

/** Parse YYYY-MM-DD as local midnight (not UTC) */
const toDate = (iso: string) => new Date(iso + 'T00:00:00');

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

export function isEditableWithin7Days(iso: string): boolean {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 7);
    cutoff.setHours(0, 0, 0, 0);
    return toDate(iso) >= cutoff;
}
