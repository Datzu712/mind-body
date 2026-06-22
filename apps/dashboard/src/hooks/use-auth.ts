import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch, ApiError } from '@/lib/api';

export interface AuthUser {
    id: string;
    keycloakSubject: string;
    fullName: string;
    phone: string | null;
    status: string;
    roles: string[];
}

export const AUTH_QUERY_KEY = ['auth', 'me'] as const;

export function useAuth() {
    const queryClient = useQueryClient();

    const query = useQuery<AuthUser>({
        queryKey: AUTH_QUERY_KEY,
        queryFn: async () => apiFetch<AuthUser>('/api/v1/auth/me'),
        retry: false,
        staleTime: 1000 * 60 * 5,
        refetchOnWindowFocus: true,
    });

    const logout = async () => {
        try {
            const data = await apiFetch<{ logoutUrl: string }>('/api/v1/auth/logout', {
                method: 'POST',
            });
            queryClient.removeQueries({ queryKey: AUTH_QUERY_KEY });
            window.location.href = data.logoutUrl;
        } catch {
            // Even if logout API fails, redirect to login
            window.location.href = '/';
        }
    };

    return {
        user: query.data,
        isLoading: query.isLoading,
        isAuthenticated: query.isSuccess,
        isError: query.isError,
        error: query.error,
        is401: query.error instanceof ApiError && query.error.status === 401,
        logout,
    };
}
