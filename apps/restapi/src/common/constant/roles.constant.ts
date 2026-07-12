import type { JWTPayload } from 'jose';

export const APP_ROLES = ['ADMIN', 'TRAINER', 'STAFF', 'MEMBER'] as const;

export type AppRole = (typeof APP_ROLES)[number];

// Roles allowed to authenticate into the admin dashboard (mobile-only MEMBER excluded).
// readonly: this is spread into @Roles(...) on every dashboard controller — must not be mutated in place.
export const DASHBOARD_ROLES: readonly AppRole[] = ['ADMIN', 'TRAINER', 'STAFF'];

function isAppRole(name: string): name is AppRole {
    return (APP_ROLES as readonly string[]).includes(name);
}

interface RealmAccessClaim {
    roles?: string[];
}

// Realm roles come from Keycloak mixed in with framework-internal ones
// (default-roles-<realm>, offline_access, uma_authorization); the app-role
// allowlist doubles as the filter for those.
export function extractRealmRoles(payload: JWTPayload): AppRole[] {
    const realmAccess = payload.realm_access as RealmAccessClaim | undefined;
    const rawRoles = realmAccess?.roles;

    if (!Array.isArray(rawRoles)) return [];

    return rawRoles.filter(isAppRole);
}

// ADMIN and STAFF are equivalent everywhere. TRAINER shares every dashboard
// permission except adding/attaching a MEMBER profile — that stays ADMIN/STAFF-only.
export function canAssignProfileType(roles: AppRole[], profileType: 'MEMBER' | 'TRAINER' | 'STAFF'): boolean {
    if (profileType !== 'MEMBER') return true;
    return roles.includes('ADMIN') || roles.includes('STAFF');
}
