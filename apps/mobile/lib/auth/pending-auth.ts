import { logger } from '../utils/log';
import { deleteAuthStorageItem, getAuthStorageItem, setAuthStorageItem } from './storage';

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
        setAuthStorageItem(KEYS.codeVerifier, request.codeVerifier),
        setAuthStorageItem(KEYS.state, request.state ?? ''),
        setAuthStorageItem(KEYS.action, request.action),
    ]);
}

export async function loadPendingAuthRequest(): Promise<PendingAuthRequest | null> {
    const [codeVerifier, state, action] = await Promise.all([
        getAuthStorageItem(KEYS.codeVerifier),
        getAuthStorageItem(KEYS.state),
        getAuthStorageItem(KEYS.action),
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
        deleteAuthStorageItem(KEYS.codeVerifier),
        deleteAuthStorageItem(KEYS.state),
        deleteAuthStorageItem(KEYS.action),
    ]);
}
