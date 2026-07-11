import { useAuth } from '@/context/auth-context';

export function useIsTrainer(): boolean {
    const { user } = useAuth();
    const claims = user?.claims;
    if (!claims) return false;

    const direct = claims.role;
    if (typeof direct === 'string' && direct.toUpperCase() === 'TRAINER') return true;

    const realmAccess = claims.realm_access;
    if (realmAccess && typeof realmAccess === 'object' && 'roles' in realmAccess) {
        const roles = (realmAccess as Record<string, unknown>).roles;
        if (Array.isArray(roles) && roles.some((r) => String(r).toUpperCase() === 'TRAINER')) return true;
    }

    const resourceRoles = claims.resource_access;
    if (resourceRoles && typeof resourceRoles === 'object') {
        for (const client of Object.values(resourceRoles as Record<string, unknown>)) {
            if (client && typeof client === 'object' && 'roles' in client) {
                const roles = (client as Record<string, unknown>).roles;
                if (Array.isArray(roles) && roles.some((r) => String(r).toUpperCase() === 'TRAINER')) return true;
            }
        }
    }

    return false;
}
