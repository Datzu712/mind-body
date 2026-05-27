export interface AuthUser {
    sub: string;
    username: string | null;
    email: string | null;
    name: string | null;
    givenName: string | null;
    familyName: string | null;
    claims: Record<string, unknown>;
}

function decodeJwtPayload(payload: string): string {
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
    return decodeURIComponent(
        atob(padded)
            .split('')
            .map((char) => `%${char.charCodeAt(0).toString(16).padStart(2, '0')}`)
            .join(''),
    );
}

function getStringClaim(claims: Record<string, unknown>, key: string): string | null {
    const value = claims[key];
    return typeof value === 'string' && value.trim().length > 0 ? value : null;
}

export function decodeTokenClaims(token: string): Record<string, unknown> | null {
    try {
        // header.payload.signature
        const [, payload] = token.split('.');
        if (!payload) return null;

        const parsed = JSON.parse(decodeJwtPayload(payload));

        return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : null;
    } catch {
        return null;
    }
}

export function extractUserFromToken(token: string): AuthUser | null {
    const claims = decodeTokenClaims(token);
    const sub = claims ? getStringClaim(claims, 'sub') : null;

    if (!claims || !sub) return null;

    return {
        sub,
        username: getStringClaim(claims, 'preferred_username'),
        email: getStringClaim(claims, 'email'),
        name: getStringClaim(claims, 'name'),
        givenName: getStringClaim(claims, 'given_name'),
        familyName: getStringClaim(claims, 'family_name'),
        claims,
    };
}
