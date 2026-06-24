import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import type { UserBase, UserDetail, PaginatedResponse, DniType } from './types';

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
    dateOfBirth: string;
    nationality: string;
}

export function useTseLookup(cedula: string) {
    return useQuery({
        queryKey: ['tse', cedula],
        queryFn: async () => apiFetch<TsePersonData>(`/api/v1/tse/${cedula}`),
        enabled: false, // manual trigger only
        retry: false,
    });
}
