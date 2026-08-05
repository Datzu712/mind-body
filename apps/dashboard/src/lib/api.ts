// In dev the paths stay relative so the Vite proxy handles /api (cookies stay
// first-party). In production builds there is no proxy: every call is prefixed
// with the API origin (e.g. https://restapi-mab.meddyg.com), scheme included.
export const API_BASE = import.meta.env.PROD ? (import.meta.env.VITE_API_BASE_URL ?? '') : '';

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
    const headers: HeadersInit = { ...init?.headers };
    if (init?.body) {
        (headers as Record<string, string>)['Content-Type'] = 'application/json';
    }

    const res = await fetch(`${API_BASE}${path}`, {
        ...init,
        credentials: 'include',
        headers,
    });

    if (!res.ok) {
        throw new ApiError(res.status, res.statusText, await readErrorMessage(res));
    }

    if (res.status === 204) {
        return undefined as T;
    }

    return res.json() as Promise<T>;
}

/**
 * Pull the human-readable message out of a failed response. NestJS error bodies
 * are `{ statusCode, message, error }` where `message` is a string (e.g. a
 * thrown HttpException) or a string[] (ValidationPipe). Falls back to undefined
 * so ApiError can use its generic `API <status>` message.
 */
async function readErrorMessage(res: Response): Promise<string | undefined> {
    try {
        const body = (await res.clone().json()) as { message?: unknown };
        if (Array.isArray(body.message)) return body.message.filter(Boolean).join(' ');
        if (typeof body.message === 'string' && body.message) return body.message;
    } catch {
        try {
            const text = await res.text();
            if (text) return text;
        } catch {
            /* ignore — fall back to the generic message */
        }
    }
    return undefined;
}

export class ApiError extends Error {
    constructor(
        public readonly status: number,
        public readonly statusText: string,
        message?: string,
    ) {
        super(message ?? `API ${status}: ${statusText}`);
        this.name = 'ApiError';
    }
}

export function getLoginUrl(redirect = '/dashboard'): string {
    return `${API_BASE}/api/v1/auth/login?redirect=${encodeURIComponent(redirect)}`;
}

/** Keycloak's account console. The API redirects, so the realm URL stays server-side. */
export function getAccountUrl(): string {
    return `${API_BASE}/api/v1/auth/account`;
}
