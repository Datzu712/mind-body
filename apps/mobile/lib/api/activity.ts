export interface DailyActivity {
    id: string;
    memberId: string;
    date: string;
    steps: number;
    caloriesTotal: string;
    activeMinutes: number;
    exerciseCount: number;
    distanceMeters: string;
    source: 'HEALTH_CONNECT' | 'MANUAL';
    createdAt: string;
    updatedAt: string;
}

export interface UpsertDailyActivityPayload {
    date: string;
    steps?: number;
    caloriesTotal?: number;
    activeMinutes?: number;
    exerciseCount?: number;
    distanceMeters?: number;
    source: 'HEALTH_CONNECT' | 'MANUAL';
}

export async function upsertDailyActivity(
    apiFetch: (path: string, options?: RequestInit) => Promise<Response>,
    payload: UpsertDailyActivityPayload,
): Promise<DailyActivity> {
    const res = await apiFetch('/activity/daily', {
        method: 'PUT',
        body: JSON.stringify(payload),
    });
    return res.json();
}

export async function getDailyActivityRange(
    apiFetch: (path: string, options?: RequestInit) => Promise<Response>,
    from: string,
    to: string,
): Promise<DailyActivity[]> {
    const res = await apiFetch(`/activity/daily/range?from=${from}&to=${to}`);
    return res.json();
}
