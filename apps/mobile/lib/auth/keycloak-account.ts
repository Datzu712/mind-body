const KEYCLOAK_URL = process.env.EXPO_PUBLIC_KEYCLOAK_URL!;
const KEYCLOAK_REALM = process.env.EXPO_PUBLIC_KEYCLOAK_REALM!;
const KEYCLOAK_CLIENT_ID = process.env.EXPO_PUBLIC_KEYCLOAK_CLIENT_ID!;

const base = `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}`;

export const keycloakAccountUrls = {
    resetPassword: `${base}/login-actions/reset-credentials`,
    accountConsole: `${base}/account`,
    // Seccion de seguridad del Account Console (2FA, cambio de contrasena)
    accountSecurity: `${base}/account/account-security/signing-in`,
} as const;

/**
 * Invalida la sesión del lado de Keycloak via back-channel logout.
 * No lanza error — el sign-out local debe continuar igual si esto falla.
 */
export async function revokeKeycloakSession(refreshToken: string): Promise<void> {
    const url = `${base}/protocol/openid-connect/logout`;
    const body = new URLSearchParams({
        client_id: KEYCLOAK_CLIENT_ID,
        refresh_token: refreshToken,
    });

    await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
    });
}
