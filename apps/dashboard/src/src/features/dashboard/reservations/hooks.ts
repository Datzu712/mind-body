// Hooks react-query del módulo Reservas/Clases (patrón de users/hooks.ts),
// ahora contra el API real vía api.ts (los mocks fueron eliminados).

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { addDays, format } from 'date-fns';
import * as api from './api';
import type { ClassFormData, ClassStatus } from './types';
import { weekStartForOffset } from './utils';

export const reservationKeys = {
    classes: ['gym-classes'] as const,
    trainers: ['trainers'] as const,
    sessions: (from: string, to: string, mine: boolean) => ['sessions', 'range', from, to, mine] as const,
    session: (id: string) => ['sessions', 'detail', id] as const,
    sessionReservations: (id: string) => ['sessions', 'detail', id, 'reservations'] as const,
    rescheduleOptions: (id: string) => ['reservations', id, 'reschedule-options'] as const,
};

// ── Queries ─────────────────────────────────────────────────────────────────

export function useGymClasses() {
    return useQuery({ queryKey: reservationKeys.classes, queryFn: async () => api.fetchClasses() });
}

// GET /classes/trainer-options es ADMIN/STAFF en la API: `enabled` permite que
// el llamador se salte el request cuando el rol no puede consultarlo.
export function useTrainers(enabled = true) {
    return useQuery({ queryKey: reservationKeys.trainers, queryFn: async () => api.fetchTrainers(), enabled });
}

// `mine`: agenda propia del entrenador. Es un filtro del servidor, no un permiso —
// el catálogo completo lo puede leer cualquier rol autenticado.
export function useWeekSessions(weekOffset: number, mine = false) {
    const start = weekStartForOffset(weekOffset);
    const from = format(start, 'yyyy-MM-dd');
    const to = format(addDays(start, 6), 'yyyy-MM-dd');
    return useQuery({
        queryKey: reservationKeys.sessions(from, to, mine),
        queryFn: async () => api.fetchSessions(from, to, mine),
    });
}

export function useSession(id: string | null) {
    return useQuery({
        queryKey: reservationKeys.session(id ?? 'none'),
        queryFn: async () => api.fetchSession(id ?? ''),
        enabled: !!id,
    });
}

export function useSessionReservations(id: string | null) {
    return useQuery({
        queryKey: reservationKeys.sessionReservations(id ?? 'none'),
        queryFn: async () => api.fetchSessionReservations(id ?? ''),
        enabled: !!id,
    });
}

export function useRescheduleOptions(reservationId: string, enabled: boolean) {
    return useQuery({
        queryKey: reservationKeys.rescheduleOptions(reservationId),
        queryFn: async () => api.fetchRescheduleOptions(reservationId),
        enabled,
    });
}

// ── Mutations ───────────────────────────────────────────────────────────────
// Invalidan las raíces afectadas; el server recalcula ocupación e impactos.

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
    return useMutation({ mutationFn: async (dto: ClassFormData) => api.createClass(dto), onSuccess: invalidate });
}

export function useUpdateClass() {
    const invalidate = useInvalidateAll();
    return useMutation({
        mutationFn: async ({ id, dto, version }: { id: string; dto: ClassFormData; version: number }) =>
            api.updateClass(id, dto, version),
        onSuccess: invalidate,
    });
}

export function useSetClassStatus() {
    const invalidate = useInvalidateAll();
    return useMutation({
        mutationFn: async ({ id, status, version }: { id: string; status: ClassStatus; version: number }) =>
            api.setClassStatus(id, status, version),
        onSuccess: invalidate,
    });
}

export function useDeleteClass() {
    const invalidate = useInvalidateAll();
    return useMutation({
        mutationFn: async ({ id, version }: { id: string; version: number }) => api.deleteClass(id, version),
        onSuccess: invalidate,
    });
}

export function useMoveSession() {
    const invalidate = useInvalidateAll();
    return useMutation({
        mutationFn: async ({
            id,
            date,
            startTime,
            version,
        }: {
            id: string;
            date: string;
            startTime: string;
            version: number;
        }) => api.moveSession(id, { date, startTime }, version),
        onSuccess: invalidate,
    });
}

export function useCancelSession() {
    const invalidate = useInvalidateAll();
    return useMutation({
        mutationFn: async ({ id, version }: { id: string; version: number }) => api.cancelSession(id, version),
        onSuccess: invalidate,
    });
}

export function useCancelReservation() {
    const invalidate = useInvalidateAll();
    return useMutation({ mutationFn: async (id: string) => api.cancelReservation(id), onSuccess: invalidate });
}

export function useRescheduleReservation() {
    const invalidate = useInvalidateAll();
    return useMutation({
        mutationFn: async ({ id, newSessionId }: { id: string; newSessionId: string }) =>
            api.rescheduleReservation(id, newSessionId),
        onSuccess: invalidate,
    });
}

export function useMarkAttendance() {
    const invalidate = useInvalidateAll();
    return useMutation({
        mutationFn: async ({ id, attended }: { id: string; attended: boolean }) => api.markAttendance(id, attended),
        onSuccess: invalidate,
    });
}
