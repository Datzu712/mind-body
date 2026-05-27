import * as SecureStore from 'expo-secure-store';

export interface PendingAuthRequest {
    codeVerifier: string;
    state: string | null;
}

const KEYS = {
    codeVerifier: 'auth.pending.code_verifier',
    state: 'auth.pending.state',
} as const;

export async function savePendingAuthRequest(request: PendingAuthRequest): Promise<void> {
    await Promise.all([
        SecureStore.setItemAsync(KEYS.codeVerifier, request.codeVerifier),
        SecureStore.setItemAsync(KEYS.state, request.state ?? ''),
    ]);
}

export async function loadPendingAuthRequest(): Promise<PendingAuthRequest | null> {
    const [codeVerifier, state] = await Promise.all([
        SecureStore.getItemAsync(KEYS.codeVerifier),
        SecureStore.getItemAsync(KEYS.state),
    ]);

    if (!codeVerifier) return null;

    return {
        codeVerifier,
        state: state || null,
    };
}

export async function clearPendingAuthRequest(): Promise<void> {
    await Promise.all([SecureStore.deleteItemAsync(KEYS.codeVerifier), SecureStore.deleteItemAsync(KEYS.state)]);
}
