import { describe, expect, it } from 'vitest';
import type { JWTPayload } from 'jose';

import { canAssignProfileType, extractRealmRoles } from '../src/common/constant/roles.constant';
import type { AppRole } from '../src/common/constant/roles.constant';

function makePayload(roles: string[]): JWTPayload {
    return { realm_access: { roles } } as JWTPayload;
}

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

describe('canAssignProfileType — TRAINER may do everything ADMIN/STAFF can except add a MEMBER', () => {
    const allowedForMember: Array<[string, AppRole[]]> = [
        ['ADMIN alone', ['ADMIN']],
        ['STAFF alone', ['STAFF']],
        ['ADMIN + TRAINER (has ADMIN)', ['ADMIN', 'TRAINER']],
        ['STAFF + TRAINER (has STAFF)', ['STAFF', 'TRAINER']],
    ];

    it.each(allowedForMember)('allows creating a MEMBER profile for %s', (_label, roles) => {
        expect(canAssignProfileType(roles, 'MEMBER')).toBe(true);
    });

    const blockedForMember: Array<[string, AppRole[]]> = [
        ['TRAINER alone', ['TRAINER']],
        ['no roles', []],
    ];

    it.each(blockedForMember)('blocks creating a MEMBER profile for %s', (_label, roles) => {
        expect(canAssignProfileType(roles, 'MEMBER')).toBe(false);
    });

    const nonMemberProfileTypes: Array<'TRAINER' | 'STAFF'> = ['TRAINER', 'STAFF'];
    const anyRoleSet: Array<[string, AppRole[]]> = [
        ['ADMIN', ['ADMIN']],
        ['STAFF', ['STAFF']],
        ['TRAINER', ['TRAINER']],
        ['no roles', []],
    ];

    for (const profileType of nonMemberProfileTypes) {
        it.each(anyRoleSet)(`never blocks assigning a ${profileType} profile, even for %s`, (_label, roles) => {
            expect(canAssignProfileType(roles, profileType)).toBe(true);
        });
    }
});
