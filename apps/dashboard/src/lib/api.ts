export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
    const headers: HeadersInit = { ...init?.headers };
    if (init?.body) {
        (headers as Record<string, string>)['Content-Type'] = 'application/json';
    }

    const res = await fetch(path, {
        ...init,
        credentials: 'include',
        headers,
    });

    if (!res.ok) {
        throw new ApiError(res.status, res.statusText);
    }

    return res.json() as Promise<T>;
}

export class ApiError extends Error {
    constructor(
        public readonly status: number,
        public readonly statusText: string,
    ) {
        super(`API ${status}: ${statusText}`);
        this.name = 'ApiError';
    }
}

export function getLoginUrl(redirect = '/dashboard'): string {
    return `/api/v1/auth/login?redirect=${encodeURIComponent(redirect)}`;
}
