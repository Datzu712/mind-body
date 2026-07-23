import { AuthRequest } from 'expo-auth-session';
import { Platform } from 'react-native';

import { keycloakConfig } from './config';
import { clearPendingAuthRequest, type PendingAuthAction, savePendingAuthRequest } from './pending-auth';

export type KcAction = Extract<PendingAuthAction, 'UPDATE_PASSWORD' | 'UPDATE_EMAIL' | 'CONFIGURE_TOTP'>;

/**
 * Returns a function that initiates an Application Initiated Action (AIA) flow.
 * Uses the same PKCE authorization code flow as login, with an extra `kc_action`
 * parameter that directs Keycloak to the specific action screen.
 *
 * If the user has an active Keycloak browser session, they go straight to the
 * action. If not, Keycloak asks them to re-authenticate first.
 *
 * On completion, callback.tsx exchanges the code for new tokens and updates
 * the session in place (no re-login required).
 */
export function useInitiateAction() {
    return async (action: KcAction): Promise<void> => {
        const request = new AuthRequest({
            clientId: keycloakConfig.clientId,
            redirectUri: keycloakConfig.redirectUri,
            usePKCE: true,
            scopes: ['openid', 'profile', 'email', 'offline_access'],
            extraParams: { kc_action: action },
        });

        // makeAuthUrlAsync generates the codeVerifier; must be called before
        // promptAsync so we can persist it for the callback.
        await request.makeAuthUrlAsync(keycloakConfig.discovery);

        await savePendingAuthRequest({
            codeVerifier: request.codeVerifier!,
            state: request.state ?? null,
            action,
        });

        const result = await request.promptAsync(
            keycloakConfig.discovery,
            Platform.OS === 'android' ? { createTask: true, showInRecents: false, useProxyActivity: false } : undefined,
        );

        if (result.type !== 'success') {
            await clearPendingAuthRequest();
        }
    };
}
