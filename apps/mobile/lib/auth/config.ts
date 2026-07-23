import * as AuthSession from 'expo-auth-session';

const rawKeycloakUrl = process.env.EXPO_PUBLIC_KEYCLOAK_URL!;
const KEYCLOAK_URL = rawKeycloakUrl;
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
