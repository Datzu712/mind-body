import { useCallback } from 'react';

import { useAuth } from '@/context/auth-context';
import { type AuthSession } from '@/lib/auth/session';
import { refreshSession } from '@/lib/auth/token-refresh';
import { logger } from '../utils/log';

export interface ApiFetchOptions {
    path: string;
    reqOptions?: RequestInit;
    session: AuthSession | null;
    onSessionRefreshed: (session: AuthSession) => Promise<void>;
    onAuthFailure: () => void;
}

const API_URL = process.env.EXPO_PUBLIC_API_URL!;

function fetchWithToken({
    url,
    options,
    accessToken,
}: {
    url: string;
    options: RequestInit;
    accessToken: string;
}): Promise<Response> {
    return fetch(url, {
        ...options,
        headers: {
            // Solo cuando hay body: Fastify rechaza application/json con body
            // vacío (FST_ERR_CTP_EMPTY_JSON_BODY) en POSTs sin payload.
            ...(options.body ? { 'Content-Type': 'application/json' } : {}),
            ...options.headers,
            Authorization: `Bearer ${accessToken}`,
        },
    });
}

// Ensures concurrent 401s only trigger a single token refresh
let pendingRefresh: Promise<AuthSession> | null = null;

async function tryRefreshToken(session: AuthSession): Promise<AuthSession> {
    if (!pendingRefresh) {
        pendingRefresh = refreshSession(session).finally(() => {
            pendingRefresh = null;
        });
    }
    return pendingRefresh;
}

export async function apiFetch({
    path,
    reqOptions = {},
    session,
    onSessionRefreshed,
    onAuthFailure,
}: ApiFetchOptions): Promise<Response> {
    const url = `${API_URL}${path}`;

    logger.debug(`apiFetch: ${reqOptions.method ?? 'GET'} ${url}`);
    const response = await fetchWithToken({ url, options: reqOptions, accessToken: session?.accessToken ?? '' });
    logger.debug(`apiFetch response: ${response.status}`);

    if (!session) {
        if (response.status === 401) {
            if (__DEV__) logger.error('apiFetch: received 401 but no session active');
            onAuthFailure();
        }
        return response;
    }

    if (response.status !== 401) return response;

    try {
        const newSession = await tryRefreshToken(session);
        await onSessionRefreshed(newSession);
        return fetchWithToken({ url, options: reqOptions, accessToken: newSession.accessToken });
    } catch {
        onAuthFailure();
        return response;
    }
}

export function useApiClient() {
    const { session, updateSession, signOut } = useAuth();

    return useCallback(
        (path: string, reqOptions?: RequestInit) =>
            apiFetch({ path, reqOptions, session, onSessionRefreshed: updateSession, onAuthFailure: signOut }),
        [session, updateSession, signOut],
    );
}
