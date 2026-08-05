import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function formatDate(raw: string | null | undefined): string {
    if (!raw) return '—';
    // A bare 'YYYY-MM-DD' is parsed as UTC midnight, which renders as the day
    // before anywhere west of Greenwich (the gym runs at UTC-6). Pinning the time
    // part forces the local-midnight reading the date column actually means.
    const date = new Date(/^\d{4}-\d{2}-\d{2}$/.test(raw) ? `${raw}T00:00:00` : raw);
    if (isNaN(date.getTime())) return raw;
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function getInitials(name: string): string {
    return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}

export function hasChanges<T extends object>(current: Partial<T>, original: T): boolean {
    const keys = Object.keys(current) as (keyof T)[];
    for (const key of keys) {
        if ((current[key] ?? '') !== (original[key] ?? '')) return true;
    }
    return false;
}
