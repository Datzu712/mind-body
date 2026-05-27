import * as AuthSession from 'expo-auth-session';
import Constants from 'expo-constants';

function isLoopbackHost(hostname: string): boolean {
    return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '0.0.0.0';
}

function getDevServerHost(): string | null {
    const hostUri = Constants.expoConfig?.hostUri;
    if (!hostUri) return null;

    const [host] = hostUri.split(':');
    return host || null;
}

function resolveKeycloakUrl(rawUrl: string): string {
    try {
        const parsedUrl = new URL(rawUrl);
        const devServerHost = getDevServerHost();

        if (!isLoopbackHost(parsedUrl.hostname) || !devServerHost) {
            return rawUrl;
        }

        parsedUrl.hostname = devServerHost;
        return parsedUrl.toString().replace(/\/$/, '');
    } catch {
        return rawUrl;
    }
}

const rawKeycloakUrl = process.env.EXPO_PUBLIC_KEYCLOAK_URL!;
const KEYCLOAK_URL = resolveKeycloakUrl(rawKeycloakUrl);
const KEYCLOAK_REALM = process.env.EXPO_PUBLIC_KEYCLOAK_REALM!;
const KEYCLOAK_CLIENT_ID = process.env.EXPO_PUBLIC_KEYCLOAK_CLIENT_ID!;

const baseUrl = `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect`;
const redirectUri = AuthSession.makeRedirectUri({ scheme: 'mindandbody', path: 'callback' });

if (__DEV__) {
    console.log('[auth] keycloakUrl:', KEYCLOAK_URL);
    console.log('[auth] redirectUri:', redirectUri);
}

export const keycloakConfig = {
    clientId: KEYCLOAK_CLIENT_ID,
    redirectUri,
    discovery: {
        authorizationEndpoint: `${baseUrl}/auth`,
        tokenEndpoint: `${baseUrl}/token`,
        revocationEndpoint: `${baseUrl}/revoke`,
        endSessionEndpoint: `${baseUrl}/logout`,
    },
} as const;
