import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useApiClient } from '@/lib/api/client';
import {
    confirmSession,
    createSession,
    getNotifications,
    getRoutine,
    getRoutines,
    getSessions,
    markNotificationRead,
    updateExerciseLog,
    validateSession,
} from '@/lib/api/training';
import type { CreateExerciseLogPayload } from '@/lib/api/types/training';

export const ROUTINES_QUERY_KEY = ['routines'] as const;
export const ROUTINE_QUERY_KEY = ['routines', 'detail'] as const;
export const SESSIONS_QUERY_KEY = ['sessions'] as const;
export const NOTIFICATIONS_QUERY_KEY = ['notifications'] as const;

export function useRoutines() {
    const api = useApiClient();
    return useQuery({
        queryKey: ROUTINES_QUERY_KEY,
        queryFn: () => getRoutines(api),
        staleTime: 2 * 60 * 1000,
    });
}

export function useRoutine(id: string) {
    const api = useApiClient();
    return useQuery({
        queryKey: [...ROUTINE_QUERY_KEY, id],
        queryFn: () => getRoutine(api, id),
        enabled: Boolean(id),
        staleTime: 2 * 60 * 1000,
    });
}

export function useSessions() {
    const api = useApiClient();
    return useQuery({
        queryKey: SESSIONS_QUERY_KEY,
        queryFn: () => getSessions(api),
        staleTime: 2 * 60 * 1000,
    });
}

export function useNotifications() {
    const api = useApiClient();
    return useQuery({
        queryKey: NOTIFICATIONS_QUERY_KEY,
        queryFn: () => getNotifications(api),
        staleTime: 60 * 1000,
    });
}

export function useCreateSession() {
    const api = useApiClient();
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (memberRoutineId: string) => createSession(api, memberRoutineId),
        onSuccess: () => qc.invalidateQueries({ queryKey: SESSIONS_QUERY_KEY }),
    });
}

export function useUpdateExerciseLog() {
    const api = useApiClient();
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ sessionId, payload }: { sessionId: string; payload: CreateExerciseLogPayload }) =>
            updateExerciseLog(api, sessionId, payload),
        onSuccess: () => qc.invalidateQueries({ queryKey: SESSIONS_QUERY_KEY }),
    });
}

export function useConfirmSession() {
    const api = useApiClient();
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (sessionId: string) => confirmSession(api, sessionId),
        onSuccess: () => qc.invalidateQueries({ queryKey: SESSIONS_QUERY_KEY }),
    });
}

export function useValidateSession() {
    const api = useApiClient();
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (sessionId: string) => validateSession(api, sessionId),
        onSuccess: () => {
            void qc.invalidateQueries({ queryKey: SESSIONS_QUERY_KEY });
            void qc.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
        },
    });
}

export function useMarkNotificationRead() {
    const api = useApiClient();
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => markNotificationRead(api, id),
        onSuccess: () => qc.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY }),
    });
}
