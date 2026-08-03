/**
 * Catálogo de ejercicios (solo consulta). El backend habla inglés/ISO;
 * los nombres de ejercicios quedan en inglés (estándar de gimnasio) y los
 * labels de músculo/equipo se traducen con lib/exercise-labels.
 */
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';

import { useApiClient } from './client';

export interface ExerciseSlim {
    id: string;
    name: string;
    bodyPart: string | null;
    equipment: string | null;
    target: string | null;
    muscleGroup: string | null;
    imageUrl: string | null;
    gifUrl: string | null;
}

export interface ExerciseDetail extends ExerciseSlim {
    secondaryMuscles: string[];
    instructions: string[];
    description: string | null;
}

export interface PaginatedExercises {
    items: ExerciseSlim[];
    total: number;
    limit: number;
    offset: number;
}

export interface ExerciseFacets {
    bodyParts: string[];
    equipments: string[];
    targets: string[];
}

export interface ExerciseFilters {
    q?: string;
    bodyPart?: string;
    equipment?: string;
}

export const EXERCISES_PAGE_SIZE = 24;

/** Lanza con el mensaje del backend (`{ message }` de DomainHttpException). */
async function okJson<T>(res: Response): Promise<T> {
    if (!res.ok) {
        let message = `Error ${res.status}`;
        try {
            const body = (await res.json()) as { message?: unknown };
            if (typeof body.message === 'string' && body.message) message = body.message;
        } catch {
            /* body no-JSON: se usa el mensaje genérico */
        }
        throw new Error(message);
    }
    return (await res.json()) as T;
}

export function useExercises(filters: ExerciseFilters) {
    const apiFetch = useApiClient();
    return useInfiniteQuery({
        queryKey: ['exercises', 'list', filters],
        initialPageParam: 0,
        queryFn: async ({ pageParam }) => {
            const params = new URLSearchParams({
                limit: String(EXERCISES_PAGE_SIZE),
                offset: String(pageParam),
            });
            if (filters.q) params.set('q', filters.q);
            if (filters.bodyPart) params.set('bodyPart', filters.bodyPart);
            if (filters.equipment) params.set('equipment', filters.equipment);
            return okJson<PaginatedExercises>(await apiFetch(`/exercises?${params.toString()}`));
        },
        getNextPageParam: (last) => {
            const next = last.offset + last.items.length;
            return next < last.total ? next : undefined;
        },
    });
}

export function useExercise(id: string | undefined) {
    const apiFetch = useApiClient();
    return useQuery({
        queryKey: ['exercises', 'detail', id],
        queryFn: async () => okJson<ExerciseDetail>(await apiFetch(`/exercises/${id}`)),
        enabled: !!id,
    });
}

export function useExerciseFacets() {
    const apiFetch = useApiClient();
    return useQuery({
        queryKey: ['exercises', 'facets'],
        queryFn: async () => okJson<ExerciseFacets>(await apiFetch('/exercises/facets')),
        staleTime: Infinity, // catálogo fijo
    });
}
