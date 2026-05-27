import * as SecureStore from 'expo-secure-store';

export interface AuthSession {
    accessToken: string;
    refreshToken: string;
    expiresAt: number; // epoch ms
}

const KEYS = {
    accessToken: 'auth.access_token',
    refreshToken: 'auth.refresh_token',
    expiresAt: 'auth.expires_at',
} as const;

export async function saveSession(session: AuthSession): Promise<void> {
    await Promise.all([
        SecureStore.setItemAsync(KEYS.accessToken, session.accessToken),
        SecureStore.setItemAsync(KEYS.refreshToken, session.refreshToken),
        SecureStore.setItemAsync(KEYS.expiresAt, String(session.expiresAt)),
    ]);
}

export async function loadSession(): Promise<AuthSession | null> {
    const [accessToken, refreshToken, expiresAtStr] = await Promise.all([
        SecureStore.getItemAsync(KEYS.accessToken),
        SecureStore.getItemAsync(KEYS.refreshToken),
        SecureStore.getItemAsync(KEYS.expiresAt),
    ]);

    if (!accessToken || !refreshToken || !expiresAtStr) return null;

    return { accessToken, refreshToken, expiresAt: Number(expiresAtStr) };
}

export async function clearSession(): Promise<void> {
    await Promise.all([
        SecureStore.deleteItemAsync(KEYS.accessToken),
        SecureStore.deleteItemAsync(KEYS.refreshToken),
        SecureStore.deleteItemAsync(KEYS.expiresAt),
    ]);
}
