import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import type {
    UserBase,
    UserDetail,
    PaginatedResponse,
    DniType,
    Measurement,
    MeasurementSummary,
    DailyActivity,
    Membership,
} from './types';

export const userKeys = {
    all: ['users'] as const,
    list: (filters: Record<string, unknown>) => ['users', 'list', filters] as const,
    detail: (id: string) => ['users', 'detail', id] as const,
};

export interface UsersFilters {
    page?: number;
    limit?: number;
    name?: string;
    email?: string;
    phone?: string;
    dni?: string;
    profile?: 'MEMBER' | 'TRAINER' | 'STAFF';
    status?: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
    sortBy?: 'fullName' | 'phone' | 'dni' | 'status' | 'createdAt';
    sortDir?: 'asc' | 'desc';
}

export function useUsers(filters: UsersFilters = {}) {
    return useQuery({
        queryKey: userKeys.list(filters as Record<string, unknown>),
        queryFn: async () => {
            const params = new URLSearchParams();
            for (const [key, value] of Object.entries(filters)) {
                if (value !== undefined && value !== '') {
                    params.set(key, String(value));
                }
            }
            const qs = params.toString();
            return apiFetch<PaginatedResponse<UserBase>>(`/api/v1/users${qs ? `?${qs}` : ''}`);
        },
    });
}

export function useUser(id: string) {
    return useQuery({
        queryKey: userKeys.detail(id),
        queryFn: async () => apiFetch<UserDetail>(`/api/v1/users/${id}`),
        enabled: !!id,
    });
}

export function useCreateUser() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: {
            fullName: string;
            email: string;
            phone?: string;
            dniType: 'CEDULA_NACIONAL' | 'DIMEX' | 'PASAPORTE';
            dni: string;
            birthDate?: string;
            profileType: 'MEMBER' | 'TRAINER' | 'STAFF';
            memberFields?: {
                joinedAt?: string;
                emergencyContactName?: string;
                emergencyContactPhone?: string;
            };
            trainerFields?: { specialty?: string; biography?: string };
            staffFields?: { hiredAt?: string };
        }) =>
            apiFetch<UserDetail>('/api/v1/users', {
                method: 'POST',
                body: JSON.stringify(data),
            }),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: userKeys.all });
        },
    });
}

export function useUpdateUser(id: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: {
            fullName?: string;
            phone?: string;
            status?: string;
            dni?: string;
            dniType?: DniType;
            birthDate?: string;
        }) =>
            apiFetch<UserDetail>(`/api/v1/users/${id}`, {
                method: 'PUT',
                body: JSON.stringify(data),
            }),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: userKeys.detail(id) });
            void queryClient.invalidateQueries({ queryKey: userKeys.all });
        },
    });
}

export function useCreateProfile(userId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: {
            profileType: 'MEMBER' | 'TRAINER' | 'STAFF';
            joinedAt?: string;
            emergencyContactName?: string;
            emergencyContactPhone?: string;
            specialty?: string;
            biography?: string;
            hiredAt?: string;
        }) =>
            apiFetch<UserDetail>(`/api/v1/users/${userId}/profiles`, {
                method: 'POST',
                body: JSON.stringify(data),
            }),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: userKeys.detail(userId) });
            void queryClient.invalidateQueries({ queryKey: userKeys.all });
        },
    });
}

export function useUpdateMemberProfile(userId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: { emergencyContactName?: string; emergencyContactPhone?: string; notes?: string }) =>
            apiFetch<UserDetail>(`/api/v1/users/${userId}/profiles/member`, {
                method: 'PUT',
                body: JSON.stringify(data),
            }),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: userKeys.detail(userId) });
        },
    });
}

export function useUpdateTrainerProfile(userId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: { specialty?: string; biography?: string }) =>
            apiFetch<UserDetail>(`/api/v1/users/${userId}/profiles/trainer`, {
                method: 'PUT',
                body: JSON.stringify(data),
            }),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: userKeys.detail(userId) });
        },
    });
}

export function useUpdateStaffProfile(userId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: { hiredAt?: string }) =>
            apiFetch<UserDetail>(`/api/v1/users/${userId}/profiles/staff`, {
                method: 'PUT',
                body: JSON.stringify(data),
            }),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: userKeys.detail(userId) });
        },
    });
}

export interface TsePersonData {
    fullName: string;
    dni: string;
    /** Empty string when the source is the national roll (PADRON), which lacks DOB. */
    dateOfBirth: string;
    nationality: string;
    /** Which registry resolved the lookup. Cosmetic (badge label). Defaults to 'TSE'. */
    source?: 'TSE' | 'PADRON';
}

export function useTseLookup(cedula: string) {
    return useQuery({
        queryKey: ['tse', cedula],
        queryFn: async () => apiFetch<TsePersonData>(`/api/v1/tse/${cedula}`),
        enabled: false, // manual trigger only
        retry: false,
    });
}

// --- Member progress (read-only, dashboard) --------------------------------

export const memberProgressKeys = {
    measurements: (id: string, from?: string, to?: string) =>
        ['members', id, 'measurements', { from: from ?? null, to: to ?? null }] as const,
    summary: (id: string) => ['members', id, 'measurements', 'summary'] as const,
    activity: (id: string, from: string, to: string) => ['members', id, 'activity', { from, to }] as const,
};

/** Measurements for a member within an optional [from, to] date range (newest first). */
export function useMemberMeasurements(userId: string, from?: string, to?: string, options?: { enabled?: boolean }) {
    return useQuery({
        queryKey: memberProgressKeys.measurements(userId, from, to),
        queryFn: async () => {
            const params = new URLSearchParams();
            if (from) params.set('from', from);
            if (to) params.set('to', to);
            const qs = params.toString();
            return apiFetch<Measurement[]>(`/api/v1/users/${userId}/measurements${qs ? `?${qs}` : ''}`);
        },
        enabled: !!userId && (options?.enabled ?? true),
    });
}

/** First-vs-latest comparison summary for a member's measurements. */
export function useMemberMeasurementSummary(userId: string) {
    return useQuery({
        queryKey: memberProgressKeys.summary(userId),
        queryFn: async () => apiFetch<MeasurementSummary>(`/api/v1/users/${userId}/measurements/summary`),
        enabled: !!userId,
    });
}

/** Daily activity summaries for a member within a [from, to] date range (newest first). */
export function useMemberActivity(userId: string, from: string, to: string) {
    return useQuery({
        queryKey: memberProgressKeys.activity(userId, from, to),
        queryFn: async () =>
            apiFetch<DailyActivity[]>(`/api/v1/users/${userId}/activity/daily/range?from=${from}&to=${to}`),
        enabled: !!userId && !!from && !!to,
    });
}

// --- Memberships -----------------------------------------------------------
// Every id here is `members.id` (the member PROFILE id, `user.memberProfile.id`),
// never `users.id` — that is what the API keys memberships by.

export const membershipKeys = {
    byMember: (memberId: string) => ['memberships', memberId] as const,
};

/** Membership history of a member, newest term first (index 0 is the current one). */
export function useMemberships(memberId: string | undefined) {
    return useQuery({
        queryKey: membershipKeys.byMember(memberId ?? ''),
        queryFn: async () => apiFetch<Membership[]>(`/api/v1/memberships?memberId=${memberId!}`),
        enabled: !!memberId,
    });
}

/**
 * Create or renew: the API expires the member's previous ACTIVE term itself, so
 * there is nothing to send about it.
 */
export function useCreateMembership(memberId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: { startDate: string; endDate: string; planId?: string }) =>
            apiFetch<Membership>('/api/v1/memberships', {
                method: 'POST',
                body: JSON.stringify({ memberId, ...data }),
            }),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: membershipKeys.byMember(memberId) });
        },
    });
}

/** Cancel a lapsed membership. The API rejects it with 409 while the term is still running. */
export function useCancelMembership(memberId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (membershipId: string) =>
            apiFetch<Membership>(`/api/v1/memberships/${membershipId}/cancel`, { method: 'PATCH' }),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: membershipKeys.byMember(memberId) });
        },
    });
}
