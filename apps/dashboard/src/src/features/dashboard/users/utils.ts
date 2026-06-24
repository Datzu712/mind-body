import type { UserBase, KCRole, ProfileType } from './types';

/**
 * A user "mismatches" when they hold a Keycloak role with no matching domain
 * profile (e.g. a MEMBER role but no member profile row in the DB). Used to flag
 * rows that need a profile created.
 */
export function hasMismatch(user: UserBase): boolean {
    const roleToProfile: Record<KCRole, ProfileType> = {
        ADMIN: 'STAFF',
        TRAINER: 'TRAINER',
        MEMBER: 'MEMBER',
        STAFF: 'STAFF',
    };
    return user.roles.some((role) => !user.profiles.includes(roleToProfile[role]));
}
