import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import type { Exercise, Routine, RoutineFormData, RoutineMember, TrainingSession } from './types';
import type { UserBase, PaginatedResponse } from '@/src/features/dashboard/users/types';
import { notificationKeys } from '@/src/features/dashboard/hooks/use-notifications';

export const routineKeys = {
    all: ['routines'] as const,
    list: () => ['routines', 'list'] as const,
    detail: (id: string) => ['routines', 'detail', id] as const,
    members: (id: string) => ['routines', 'detail', id, 'members'] as const,
    sessions: (id: string) => ['routines', 'detail', id, 'sessions'] as const,
    versions: (id: string) => ['routines', 'detail', id, 'versions'] as const,
};

export const exerciseKeys = {
    all: ['exercises'] as const,
    list: () => ['exercises', 'list'] as const,
};

export const memberKeys = {
    all: ['members'] as const,
    list: (filters: Record<string, unknown>) => ['members', 'list', filters] as const,
};

export function useRoutines() {
    return useQuery({
        queryKey: routineKeys.list(),
        queryFn: async () => apiFetch<Routine[]>('/api/v1/routines'),
    });
}

export function useRoutine(id: string) {
    return useQuery({
        queryKey: routineKeys.detail(id),
        queryFn: async () => apiFetch<Routine>(`/api/v1/routines/${id}`),
        enabled: !!id,
    });
}

export function useExercises() {
    return useQuery({
        queryKey: exerciseKeys.list(),
        queryFn: async () => apiFetch<Exercise[]>('/api/v1/exercises'),
    });
}

export interface MembersFilters {
    page?: number;
    limit?: number;
    status?: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
}

export function useMembers(filters: MembersFilters = {}) {
    return useQuery({
        queryKey: memberKeys.list(filters as Record<string, unknown>),
        queryFn: async () => {
            const params = new URLSearchParams();
            params.set('profile', 'MEMBER');
            for (const [key, value] of Object.entries(filters)) {
                if (value !== undefined && value !== '') {
                    params.set(key, String(value));
                }
            }
            return apiFetch<PaginatedResponse<UserBase>>(`/api/v1/users?${params.toString()}`);
        },
    });
}

export function useCreateRoutine() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: RoutineFormData) =>
            apiFetch<Routine>('/api/v1/routines', {
                method: 'POST',
                body: JSON.stringify(data),
            }),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: routineKeys.all });
        },
    });
}

export function useUpdateRoutine(id: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: RoutineFormData) =>
            apiFetch<Routine>(`/api/v1/routines/${id}`, {
                method: 'PUT',
                body: JSON.stringify(data),
            }),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: routineKeys.detail(id) });
            void queryClient.invalidateQueries({ queryKey: routineKeys.versions(id) });
            void queryClient.invalidateQueries({ queryKey: routineKeys.all });
        },
    });
}

export function useDeleteRoutine(id: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async () =>
            apiFetch<void>(`/api/v1/routines/${id}`, {
                method: 'DELETE',
            }),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: routineKeys.all });
        },
    });
}

export function useAssignRoutine(id: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (memberId: string) =>
            apiFetch<void>(`/api/v1/routines/${id}/assign`, {
                method: 'POST',
                body: JSON.stringify({ member_id: memberId }),
            }),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: routineKeys.members(id) });
            void queryClient.invalidateQueries({ queryKey: notificationKeys.all });
        },
    });
}

export function useRoutineMembers(id: string) {
    return useQuery({
        queryKey: routineKeys.members(id),
        queryFn: async () => {
            const rows = await apiFetch<Omit<RoutineMember, 'id'>[]>(`/api/v1/routines/${id}/members`);
            return rows.map((r) => ({ ...r, id: r.memberId }));
        },
        enabled: !!id,
    });
}

export function useRoutineSessions(id: string) {
    return useQuery({
        queryKey: routineKeys.sessions(id),
        queryFn: async () => apiFetch<TrainingSession[]>(`/api/v1/routines/${id}/sessions`),
        enabled: !!id,
    });
}

export function useValidateSession(routineId?: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (sessionId: string) =>
            apiFetch<void>(`/api/v1/sessions/${sessionId}/validate`, {
                method: 'POST',
            }),
        onSuccess: (_data, sessionId) => {
            void queryClient.invalidateQueries({ queryKey: routineKeys.all });
            if (routineId) {
                void queryClient.invalidateQueries({ queryKey: routineKeys.detail(routineId) });
                void queryClient.invalidateQueries({ queryKey: routineKeys.sessions(routineId) });
            }
            void queryClient.invalidateQueries({ queryKey: ['sessions', sessionId] });
            void queryClient.invalidateQueries({ queryKey: notificationKeys.all });
        },
    });
}

export function useRoutineVersions(id: string) {
    return useQuery({
        queryKey: routineKeys.versions(id),
        queryFn: async () => {
            const rows = await apiFetch<
                Array<{
                    id: string;
                    routine_id: string;
                    version_number: number;
                    snapshot: unknown;
                    changed_by: string;
                    changed_by_name: string;
                    change_reason: string | null;
                    created_at: string;
                }>
            >(`/api/v1/routines/${id}/versions`);
            return rows.map((v) => ({
                id: v.id,
                routineId: v.routine_id,
                versionNumber: v.version_number,
                snapshot: v.snapshot,
                changedBy: v.changed_by,
                changedByName: v.changed_by_name,
                changeReason: v.change_reason,
                createdAt: v.created_at,
            }));
        },
        enabled: !!id,
    });
}
