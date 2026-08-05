import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import type { PopularClassPoint, RecentReservation, StatsOverview, WeeklyReservationPoint } from './types';

export const statsKeys = {
    all: ['stats'] as const,
    overview: ['stats', 'overview'] as const,
    reservationsTrend: (weeks: number) => ['stats', 'reservations-trend', weeks] as const,
    popularClasses: (limit: number, days: number) => ['stats', 'popular-classes', limit, days] as const,
    recentReservations: (limit: number) => ['stats', 'recent-reservations', limit] as const,
};

// The home is a glanceable summary, not a live monitor: a minute of staleness is
// fine and keeps every card from refetching on each tab focus.
const STALE_TIME = 60_000;

export function useStatsOverview() {
    return useQuery({
        queryKey: statsKeys.overview,
        queryFn: async () => apiFetch<StatsOverview>('/api/v1/stats/overview'),
        staleTime: STALE_TIME,
    });
}

export function useReservationsTrend(weeks = 8) {
    return useQuery({
        queryKey: statsKeys.reservationsTrend(weeks),
        queryFn: async () => apiFetch<WeeklyReservationPoint[]>(`/api/v1/stats/reservations-trend?weeks=${weeks}`),
        staleTime: STALE_TIME,
    });
}

export function usePopularClasses(limit = 5, days = 30) {
    return useQuery({
        queryKey: statsKeys.popularClasses(limit, days),
        queryFn: async () => apiFetch<PopularClassPoint[]>(`/api/v1/stats/popular-classes?limit=${limit}&days=${days}`),
        staleTime: STALE_TIME,
    });
}

export function useRecentReservations(limit = 8) {
    return useQuery({
        queryKey: statsKeys.recentReservations(limit),
        queryFn: async () => apiFetch<RecentReservation[]>(`/api/v1/stats/recent-reservations?limit=${limit}`),
        staleTime: STALE_TIME,
    });
}
