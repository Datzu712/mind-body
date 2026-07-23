import * as SecureStore from 'expo-secure-store';
import { logger } from '../utils/log';

export type PendingAuthAction = 'login' | 'UPDATE_PASSWORD' | 'UPDATE_EMAIL' | 'CONFIGURE_TOTP';

export interface PendingAuthRequest {
    codeVerifier: string;
    state: string | null;
    action: PendingAuthAction;
}

const KEYS = {
    codeVerifier: 'auth.pending.code_verifier',
    state: 'auth.pending.state',
    action: 'auth.pending.action',
} as const;

export async function savePendingAuthRequest(request: PendingAuthRequest): Promise<void> {
    logger.debug('[auth] saving pending auth request', request);
    await Promise.all([
        SecureStore.setItemAsync(KEYS.codeVerifier, request.codeVerifier),
        SecureStore.setItemAsync(KEYS.state, request.state ?? ''),
        SecureStore.setItemAsync(KEYS.action, request.action),
    ]);
}

export async function loadPendingAuthRequest(): Promise<PendingAuthRequest | null> {
    const [codeVerifier, state, action] = await Promise.all([
        SecureStore.getItemAsync(KEYS.codeVerifier),
        SecureStore.getItemAsync(KEYS.state),
        SecureStore.getItemAsync(KEYS.action),
    ]);

    if (!codeVerifier) return null;

    return {
        codeVerifier,
        state: state || null,
        action: (action as PendingAuthAction) || 'login',
    };
}

export async function clearPendingAuthRequest(): Promise<void> {
    await Promise.all([
        SecureStore.deleteItemAsync(KEYS.codeVerifier),
        SecureStore.deleteItemAsync(KEYS.state),
        SecureStore.deleteItemAsync(KEYS.action),
    ]);
}
