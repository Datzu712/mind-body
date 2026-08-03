import type { JWTPayload } from 'jose';

export const APP_ROLES = ['ADMIN', 'TRAINER', 'STAFF', 'MEMBER'] as const;

export type AppRole = (typeof APP_ROLES)[number];

// Referencia nominal de un rol suelto: `Role.ADMIN` en vez de la cadena 'ADMIN'.
export const Role = {
    ADMIN: 'ADMIN',
    TRAINER: 'TRAINER',
    STAFF: 'STAFF',
    MEMBER: 'MEMBER',
} as const satisfies Record<string, AppRole>;

// Dashboard = todos los roles menos MEMBER (exclusivo de mobile).
export const DASHBOARD_ROLES = [Role.ADMIN, Role.TRAINER, Role.STAFF] as const;

// ADMIN y STAFF son equivalentes hoy: son los roles de gestión del gimnasio
// (usuarios y perfiles, clases, sesiones, roster y asistencia).
export const MANAGEMENT_ROLES = [Role.ADMIN, Role.STAFF] as const;

// El dueño de una reserva es MEMBER; cuál de los dos es el actor lo resuelve el
// service, que es el único que puede comparar con el miembro de la reserva.
export const OWNER_OR_MANAGEMENT_ROLES = [Role.MEMBER, ...MANAGEMENT_ROLES] as const;

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
