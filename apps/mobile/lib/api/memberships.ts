/**
 * Membresía del miembro (solo lectura). Espejo del MembershipDto del backend
 * (apps/restapi/src/modules/memberships/memberships.service.ts).
 *
 * No hay montos acá a propósito: el gimnasio cobra presencialmente, así que la
 * app nunca tiene un precio que mostrar.
 */
import { useQuery } from '@tanstack/react-query';

import { useApiClient } from './client';
import { okJson } from './http';

export type MembershipStatus = 'ACTIVE' | 'SUSPENDED' | 'EXPIRED' | 'CANCELLED';

export interface Membership {
    id: string;
    memberId: string;
    planId: string;
    planName: string;
    /** 'YYYY-MM-DD'. */
    startDate: string;
    endDate: string;
    status: MembershipStatus;
    createdAt: string;
    updatedAt: string;
}

/** Historial completo, del término más reciente al más viejo. */
export function useMyMemberships() {
    const apiFetch = useApiClient();
    return useQuery({
        queryKey: ['memberships', 'mine'],
        queryFn: async () => okJson<Membership[]>(await apiFetch('/memberships/mine')),
    });
}

/**
 * The term running today. The API sorts newest-first BY START DATE, which is not
 * the same thing: a renewal is chained to start the day after the current term
 * ends, so the head of the list can be a term that has not begun yet.
 */
export function currentMembership(memberships: Membership[] | undefined): Membership | undefined {
    if (!memberships?.length) return undefined;

    const today = todayIso();

    return (
        memberships.find((m) => m.status !== 'CANCELLED' && m.startDate <= today && m.endDate >= today) ??
        memberships[0]
    );
}

/** Local 'YYYY-MM-DD' — the same shape the date columns come back as. */
function todayIso(): string {
    const now = new Date();
    const month = `${now.getMonth() + 1}`.padStart(2, '0');
    const day = `${now.getDate()}`.padStart(2, '0');

    return `${now.getFullYear()}-${month}-${day}`;
}

/** Días que faltan para vencer; negativo si ya venció. Fechas locales, sin UTC. */
export function daysUntil(endDate: string): number {
    const end = new Date(`${endDate}T00:00:00`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return Math.round((end.getTime() - today.getTime()) / 86_400_000);
}
