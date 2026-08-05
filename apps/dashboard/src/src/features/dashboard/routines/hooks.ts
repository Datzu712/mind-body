import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import type { RoutineDetail, RoutineSummary, RoutinesFilters } from './types';

export const routineKeys = {
    all: ['routines'] as const,
    list: (filters: RoutinesFilters) => ['routines', 'list', filters] as const,
    detail: (id: string) => ['routines', 'detail', id] as const,
};

export function useRoutines(filters: RoutinesFilters) {
    return useQuery({
        queryKey: routineKeys.list(filters),
        queryFn: async () => {
            const params = new URLSearchParams();
            if (filters.q) params.set('q', filters.q);
            if (filters.status) params.set('status', filters.status);
            const qs = params.toString();
            return apiFetch<RoutineSummary[]>(`/api/v1/routines${qs ? `?${qs}` : ''}`);
        },
    });
}

export function useRoutine(id: string) {
    return useQuery({
        queryKey: routineKeys.detail(id),
        queryFn: async () => apiFetch<RoutineDetail>(`/api/v1/routines/${id}`),
        enabled: !!id,
    });
}

/** Las mutations del builder devuelven el detalle actualizado: se escribe
 *  directo al cache (sin refetch) y se invalida la lista. */
function useRoutineMutation<TVars>(routineId: string, mutationFn: (vars: TVars) => Promise<RoutineDetail>) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn,
        onSuccess: (detail) => {
            queryClient.setQueryData(routineKeys.detail(routineId), detail);
            void queryClient.invalidateQueries({ queryKey: routineKeys.all, exact: false, refetchType: 'none' });
        },
    });
}

export function useCreateRoutine() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: { name?: string; objective?: string }) =>
            apiFetch<RoutineDetail>('/api/v1/routines', { method: 'POST', body: JSON.stringify(data) }),
        onSuccess: (detail) => {
            queryClient.setQueryData(routineKeys.detail(detail.id), detail);
        },
    });
}

export function useUpdateRoutine(routineId: string) {
    return useRoutineMutation(
        routineId,
        async (data: { name?: string; objective?: string | null; status?: 'DRAFT' | 'ACTIVE' | 'ARCHIVED' }) =>
            apiFetch<RoutineDetail>(`/api/v1/routines/${routineId}`, { method: 'PUT', body: JSON.stringify(data) }),
    );
}

export function useDeleteRoutine() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (routineId: string) => apiFetch<void>(`/api/v1/routines/${routineId}`, { method: 'DELETE' }),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: routineKeys.all });
        },
    });
}

export function useAddExercise(routineId: string) {
    return useRoutineMutation(
        routineId,
        async (data: { exerciseId: string; sets?: number; reps?: string; notes?: string }) =>
            apiFetch<RoutineDetail>(`/api/v1/routines/${routineId}/exercises`, {
                method: 'POST',
                body: JSON.stringify(data),
            }),
    );
}

export function useUpdateExerciseItem(routineId: string) {
    return useRoutineMutation(
        routineId,
        async ({
            itemId,
            ...data
        }: {
            itemId: string;
            sets?: number | null;
            reps?: string | null;
            notes?: string | null;
        }) =>
            apiFetch<RoutineDetail>(`/api/v1/routines/${routineId}/exercises/${itemId}`, {
                method: 'PUT',
                body: JSON.stringify(data),
            }),
    );
}

export function useRemoveExerciseItem(routineId: string) {
    return useRoutineMutation(routineId, async (itemId: string) =>
        apiFetch<RoutineDetail>(`/api/v1/routines/${routineId}/exercises/${itemId}`, { method: 'DELETE' }),
    );
}

export function useReorderExercises(routineId: string) {
    return useRoutineMutation(routineId, async (itemIds: string[]) =>
        apiFetch<RoutineDetail>(`/api/v1/routines/${routineId}/exercises-order`, {
            method: 'PUT',
            body: JSON.stringify({ itemIds }),
        }),
    );
}

export interface AssignedMember {
    memberId: string;
    fullName: string;
    /** 'YYYY-MM-DD'. */
    assignedAt: string;
}

/** Quiénes tienen la rutina. Es la confirmación que queda en pantalla tras asignar. */
export function useAssignedMembers(routineId: string) {
    return useQuery({
        queryKey: ['routines', routineId, 'members'],
        queryFn: async () => apiFetch<AssignedMember[]>(`/api/v1/routines/${routineId}/members`),
    });
}

export function useAssignRoutine(routineId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (memberId: string) =>
            apiFetch<void>(`/api/v1/routines/${routineId}/assign`, {
                method: 'POST',
                body: JSON.stringify({ memberId }),
            }),
        // Faltaba: era la única mutación del módulo sin invalidar, así que tras
        // asignar no cambiaba nada en pantalla y parecía que no había pasado.
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ['routines', routineId, 'members'] });
        },
    });
}
