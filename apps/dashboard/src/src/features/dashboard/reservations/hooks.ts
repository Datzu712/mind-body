// Hooks react-query del módulo Reservas/Clases (patrón de users/hooks.ts).
// Los componentes consumen SOLO estos hooks. Al conectar el backend solo se
// reescriben los cuerpos de mock-api.ts — este archivo no cambia.

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { addDays, format } from 'date-fns';
import * as api from './mock-api';
import type { ClassFormData, ClassStatus } from './types';
import { weekStartForOffset } from './utils';

export const reservationKeys = {
    classes: ['gym-classes'] as const,
    trainers: ['trainers'] as const,
    sessions: (from: string, to: string) => ['sessions', 'range', from, to] as const,
    session: (id: string) => ['sessions', 'detail', id] as const,
    sessionReservations: (id: string) => ['sessions', 'detail', id, 'reservations'] as const,
    sessionWaitlist: (id: string) => ['sessions', 'detail', id, 'waitlist'] as const,
    rescheduleOptions: (id: string) => ['reservations', id, 'reschedule-options'] as const,
};

// ── Queries ─────────────────────────────────────────────────────────────────

export function useGymClasses() {
    return useQuery({ queryKey: reservationKeys.classes, queryFn: () => api.fetchClasses() });
}

export function useTrainers() {
    return useQuery({ queryKey: reservationKeys.trainers, queryFn: () => api.fetchTrainers() });
}

export function useWeekSessions(weekOffset: number) {
    const start = weekStartForOffset(weekOffset);
    const from = format(start, 'yyyy-MM-dd');
    const to = format(addDays(start, 6), 'yyyy-MM-dd');
    return useQuery({
        queryKey: reservationKeys.sessions(from, to),
        queryFn: () => api.fetchSessions(from, to),
    });
}

export function useSession(id: string | null) {
    return useQuery({
        queryKey: reservationKeys.session(id ?? 'none'),
        queryFn: () => api.fetchSession(id ?? ''),
        enabled: !!id,
    });
}

export function useSessionReservations(id: string | null) {
    return useQuery({
        queryKey: reservationKeys.sessionReservations(id ?? 'none'),
        queryFn: () => api.fetchSessionReservations(id ?? ''),
        enabled: !!id,
    });
}

export function useSessionWaitlist(id: string | null) {
    return useQuery({
        queryKey: reservationKeys.sessionWaitlist(id ?? 'none'),
        queryFn: () => api.fetchSessionWaitlist(id ?? ''),
        enabled: !!id,
    });
}

export function useRescheduleOptions(reservationId: string, enabled: boolean) {
    return useQuery({
        queryKey: reservationKeys.rescheduleOptions(reservationId),
        queryFn: () => api.fetchRescheduleOptions(reservationId),
        enabled,
    });
}

// ── Mutations ───────────────────────────────────────────────────────────────
// Con el mock instantáneo, invalidar las tres raíces tras cada mutación es
// simple y correcto (contra el server real sería el mismo refetch).

function useInvalidateAll() {
    const queryClient = useQueryClient();
    return () => {
        void queryClient.invalidateQueries({ queryKey: reservationKeys.classes });
        void queryClient.invalidateQueries({ queryKey: ['sessions'] });
        void queryClient.invalidateQueries({ queryKey: ['reservations'] });
    };
}

export function useCreateClass() {
    const invalidate = useInvalidateAll();
    return useMutation({ mutationFn: (dto: ClassFormData) => api.createClass(dto), onSuccess: invalidate });
}

export function useUpdateClass() {
    const invalidate = useInvalidateAll();
    return useMutation({
        mutationFn: ({ id, dto }: { id: string; dto: ClassFormData }) => api.updateClass(id, dto),
        onSuccess: invalidate,
    });
}

export function useSetClassStatus() {
    const invalidate = useInvalidateAll();
    return useMutation({
        mutationFn: ({ id, status }: { id: string; status: ClassStatus }) => api.setClassStatus(id, status),
        onSuccess: invalidate,
    });
}

export function useDeleteClass() {
    const invalidate = useInvalidateAll();
    return useMutation({ mutationFn: (id: string) => api.deleteClass(id), onSuccess: invalidate });
}

export function useMoveSession() {
    const invalidate = useInvalidateAll();
    return useMutation({
        mutationFn: ({ id, date, startTime }: { id: string; date: string; startTime: string }) =>
            api.moveSession(id, { date, startTime }),
        onSuccess: invalidate,
    });
}

export function useCancelSession() {
    const invalidate = useInvalidateAll();
    return useMutation({ mutationFn: (id: string) => api.cancelSession(id), onSuccess: invalidate });
}

export function useCancelReservation() {
    const invalidate = useInvalidateAll();
    return useMutation({ mutationFn: (id: string) => api.cancelReservation(id), onSuccess: invalidate });
}

export function useRescheduleReservation() {
    const invalidate = useInvalidateAll();
    return useMutation({
        mutationFn: ({ id, newSessionId }: { id: string; newSessionId: string }) =>
            api.rescheduleReservation(id, newSessionId),
        onSuccess: invalidate,
    });
}

export function useMarkAttendance() {
    const invalidate = useInvalidateAll();
    return useMutation({
        mutationFn: ({ id, attended }: { id: string; attended: boolean }) => api.markAttendance(id, attended),
        onSuccess: invalidate,
    });
}

export function usePromoteFromWaitlist() {
    const invalidate = useInvalidateAll();
    return useMutation({ mutationFn: (id: string) => api.promoteFromWaitlist(id), onSuccess: invalidate });
}

export function useRemoveFromWaitlist() {
    const invalidate = useInvalidateAll();
    return useMutation({ mutationFn: (id: string) => api.removeFromWaitlist(id), onSuccess: invalidate });
}
