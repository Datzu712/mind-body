import { describe, expect, it } from 'vitest';
import type { JWTPayload } from 'jose';

import {
    APP_ROLES,
    DASHBOARD_ROLES,
    MANAGEMENT_ROLES,
    Role,
    extractRealmRoles,
} from '../src/common/constant/roles.constant';

function makePayload(roles: string[]): JWTPayload {
    return { realm_access: { roles } } as JWTPayload;
}

describe('catálogo de roles', () => {
    it('Role expone exactamente los roles de la app, con clave = valor', () => {
        expect(Object.values(Role).sort()).toEqual([...APP_ROLES].sort());
        for (const role of APP_ROLES) {
            expect(Role[role]).toBe(role);
        }
    });

    it('DASHBOARD_ROLES es APP_ROLES sin MEMBER (exclusivo de mobile)', () => {
        expect([...DASHBOARD_ROLES].sort()).toEqual([...APP_ROLES].filter((r) => r !== Role.MEMBER).sort());
    });

    it('MANAGEMENT_ROLES (ADMIN/STAFF) es subconjunto de DASHBOARD_ROLES', () => {
        expect([...MANAGEMENT_ROLES].sort()).toEqual([Role.ADMIN, Role.STAFF].sort());
        for (const role of MANAGEMENT_ROLES) {
            expect(DASHBOARD_ROLES).toContain(role);
        }
    });
});

describe('extractRealmRoles', () => {
    it('keeps only known app roles', () => {
        expect(extractRealmRoles(makePayload(['ADMIN', 'TRAINER']))).toEqual(['ADMIN', 'TRAINER']);
    });

    it('filters out Keycloak/framework-internal roles mixed into realm_access', () => {
        const payload = makePayload(['default-roles-mab', 'offline_access', 'uma_authorization', 'STAFF']);
        expect(extractRealmRoles(payload)).toEqual(['STAFF']);
    });

    it('returns an empty array when realm_access is missing', () => {
        expect(extractRealmRoles({} as JWTPayload)).toEqual([]);
    });

    it('returns an empty array when realm_access.roles is missing', () => {
        expect(extractRealmRoles({ realm_access: {} } as JWTPayload)).toEqual([]);
    });

    it('returns an empty array instead of throwing when realm_access.roles is not an array', () => {
        const malformedPayload = { realm_access: { roles: 'ADMIN' } } as unknown as JWTPayload;
        expect(() => extractRealmRoles(malformedPayload)).not.toThrow();
        expect(extractRealmRoles(malformedPayload)).toEqual([]);
    });
});
