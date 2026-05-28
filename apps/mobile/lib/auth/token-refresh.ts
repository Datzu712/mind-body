import { keycloakConfig } from './config';
import { type AuthSession } from './session';

interface TokenResponse {
    access_token: string;
    refresh_token: string;
    expires_in: number;
}

export async function refreshSession(session: AuthSession): Promise<AuthSession> {
    const response = await fetch(keycloakConfig.discovery.tokenEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            grant_type: 'refresh_token',
            client_id: keycloakConfig.clientId,
            refresh_token: session.refreshToken,
        }).toString(),
    });

    if (!response.ok) {
        throw new Error(`Token refresh failed: ${response.status}`);
    }

    const data = (await response.json()) as TokenResponse;

    return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresAt: Date.now() + data.expires_in * 1000,
    };
}

export function isExpiringSoon(session: AuthSession, thresholdMs = 5 * 60 * 1000): boolean {
    return session.expiresAt - Date.now() < thresholdMs;
}
