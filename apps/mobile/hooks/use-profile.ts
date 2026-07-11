import { useQuery } from '@tanstack/react-query';

import { useAuth } from '@/context/auth-context';
import { useApiClient } from '@/lib/api/client';

export interface UserProfile {
    id: string;
    keycloakSubject: string;
    fullName: string | null;
    email: string | null;
    phone: string | null;
    dni: string | null;
    dniType: string | null;
    birthDate: string | null;
    status: string;
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
                  id: '',
                  keycloakSubject: user.sub,
                  fullName: user.name ?? ([user.givenName, user.familyName].filter(Boolean).join(' ') || null),
                  email: user.email,
                  phone: null,
                  dni: null,
                  dniType: null,
                  birthDate: null,
                  status: 'ACTIVE',
                  createdAt: '',
                  updatedAt: '',
              }
            : undefined,
    });
}
