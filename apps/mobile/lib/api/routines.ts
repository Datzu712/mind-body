/**
 * Rutinas asignadas al miembro (solo lectura). Espejo de los DTOs del
 * backend (apps/restapi/src/modules/routines/routine.types.ts).
 */
import { useQuery } from '@tanstack/react-query';

import { useApiClient } from './client';

export interface RoutineExerciseItem {
    /** Id de la fila routine_exercises. */
    id: string;
    exerciseId: string;
    displayOrder: number;
    sets: number | null;
    reps: string | null;
    notes: string | null;
    exercise: {
        name: string;
        bodyPart: string | null;
        equipment: string | null;
        target: string | null;
        gifUrl: string | null;
        imageUrl: string | null;
    };
}

export interface RoutineDetail {
    id: string;
    name: string;
    objective: string | null;
    status: 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'FINISHED' | 'ARCHIVED';
    createdByName: string | null;
    createdAt: string;
    updatedAt: string;
    exercises: RoutineExerciseItem[];
}

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

export function useMyRoutines() {
    const apiFetch = useApiClient();
    return useQuery({
        queryKey: ['routines', 'mine'],
        queryFn: async () => okJson<RoutineDetail[]>(await apiFetch('/routines/mine')),
    });
}
