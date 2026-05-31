import { useQuery } from '@tanstack/react-query';

import { useAuth } from '@/context/auth-context';
import { useApiClient } from '@/lib/api/client';

export interface UserProfile {
    id: number;
    keycloakId: string;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
    createdAt: string;
    updatedAt: string;
}

export const PROFILE_QUERY_KEY = ['users', 'me'] as const;

export function useProfile() {
    const { user } = useAuth();

    const apiFetch = useApiClient();

    return useQuery({
        queryKey: PROFILE_QUERY_KEY,
        queryFn: async () => {
            const res = await apiFetch('/users/me');
            if (!res.ok) throw new Error(`Failed to fetch profile: ${res.status}`);
            return res.json() as Promise<UserProfile>;
        },
        // JWT claims as temporary fallback while the backend responds
        placeholderData: user
            ? {
                  id: 0,
                  keycloakId: user.sub,
                  firstName: user.givenName,
                  lastName: user.familyName,
                  email: user.email,
                  createdAt: '',
                  updatedAt: '',
              }
            : undefined,
    });
}
