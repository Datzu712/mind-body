import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function formatDate(raw: string | null | undefined): string {
    if (!raw) return '—';
    const date = new Date(raw);
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
