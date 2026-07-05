import { deleteAuthStorageItem, getAuthStorageItem, setAuthStorageItem } from './storage';

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
        setAuthStorageItem(KEYS.accessToken, session.accessToken),
        setAuthStorageItem(KEYS.refreshToken, session.refreshToken),
        setAuthStorageItem(KEYS.expiresAt, String(session.expiresAt)),
    ]);
}

export async function loadSession(): Promise<AuthSession | null> {
    const [accessToken, refreshToken, expiresAtStr] = await Promise.all([
        getAuthStorageItem(KEYS.accessToken),
        getAuthStorageItem(KEYS.refreshToken),
        getAuthStorageItem(KEYS.expiresAt),
    ]);

    if (!accessToken || !refreshToken || !expiresAtStr) return null;

    return { accessToken, refreshToken, expiresAt: Number(expiresAtStr) };
}

export async function clearSession(): Promise<void> {
    await Promise.all([
        deleteAuthStorageItem(KEYS.accessToken),
        deleteAuthStorageItem(KEYS.refreshToken),
        deleteAuthStorageItem(KEYS.expiresAt),
    ]);
}
