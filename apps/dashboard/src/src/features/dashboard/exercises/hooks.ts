import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import type { ExerciseDetail, ExerciseFacets, ExercisesFilters, PaginatedExercises } from './types';

export const exerciseKeys = {
    all: ['exercises'] as const,
    list: (filters: ExercisesFilters) => ['exercises', 'list', filters] as const,
    detail: (id: string) => ['exercises', 'detail', id] as const,
    facets: ['exercises', 'facets'] as const,
};

export function useExercises(filters: ExercisesFilters) {
    return useQuery({
        queryKey: exerciseKeys.list(filters),
        queryFn: async () => {
            const params = new URLSearchParams({ limit: String(filters.limit), offset: String(filters.offset) });
            if (filters.q) params.set('q', filters.q);
            if (filters.bodyPart) params.set('bodyPart', filters.bodyPart);
            if (filters.equipment) params.set('equipment', filters.equipment);
            return apiFetch<PaginatedExercises>(`/api/v1/exercises?${params.toString()}`);
        },
        // Mantiene la página anterior visible mientras llega la nueva (sin flash).
        placeholderData: keepPreviousData,
    });
}

export function useExercise(id: string | null) {
    return useQuery({
        queryKey: exerciseKeys.detail(id ?? ''),
        queryFn: async () => apiFetch<ExerciseDetail>(`/api/v1/exercises/${id}`),
        enabled: !!id,
    });
}

export function useExerciseFacets() {
    return useQuery({
        queryKey: exerciseKeys.facets,
        queryFn: async () => apiFetch<ExerciseFacets>('/api/v1/exercises/facets'),
        staleTime: Infinity, // el catálogo es fijo: no revalidar en cada mount
    });
}
