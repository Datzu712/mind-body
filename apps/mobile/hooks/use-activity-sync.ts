import { useCallback, useEffect, useRef, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { initialize, readRecords, getGrantedPermissions } from 'react-native-health-connect';

import { useApiClient } from '@/lib/api/client';
import { upsertDailyActivity } from '@/lib/api/activity';
import { dayKey, startOfDay } from '@/lib/date-utils';

const SYNC_KEY = 'last_hc_sync';
const SYNC_INTERVAL = 30 * 60 * 1000; // 30 min

async function readHCRange(from: Date, to: Date) {
    const filter = {
        operator: 'between' as const,
        startTime: from.toISOString(),
        endTime: to.toISOString(),
    };

    const [stepsRes, calsRes, exRes] = await Promise.all([
        readRecords('Steps', { timeRangeFilter: filter }),
        readRecords('TotalCaloriesBurned', { timeRangeFilter: filter }).catch(() => ({ records: [] })),
        readRecords('ExerciseSession', { timeRangeFilter: filter }).catch(() => ({ records: [] })),
    ]);

    // Group by day
    const days = new Map<string, { steps: number; calories: number; activeMin: number; exercises: number }>();

    const ensure = (k: string) => {
        if (!days.has(k)) days.set(k, { steps: 0, calories: 0, activeMin: 0, exercises: 0 });
        return days.get(k)!;
    };

    for (const r of stepsRes.records) {
        const d = ensure(dayKey(new Date(r.startTime)));
        d.steps += r.count;
    }
    for (const r of calsRes.records) {
        const d = ensure(dayKey(new Date(r.startTime)));
        d.calories += r.energy?.inKilocalories ?? 0;
    }
    for (const r of exRes.records) {
        const d = ensure(dayKey(new Date(r.startTime)));
        d.exercises++;
        d.activeMin += (new Date(r.endTime).getTime() - new Date(r.startTime).getTime()) / 60000;
    }

    return days;
}

async function ensureHC(): Promise<boolean> {
    try {
        const ok = await initialize();
        if (!ok) return false;
        const perms = await getGrantedPermissions();
        return perms.length > 0;
    } catch {
        return false;
    }
}

/** Sync only today to backend */
async function syncToday(api: (path: string, options?: RequestInit) => Promise<Response>) {
    if (!(await ensureHC())) return;

    const now = new Date();
    const todayStart = startOfDay(now);
    const days = await readHCRange(todayStart, now);
    const today = days.get(dayKey(todayStart));
    if (!today) return;

    await upsertDailyActivity(api, {
        date: dayKey(todayStart),
        steps: today.steps,
        caloriesTotal: Math.round(today.calories * 100) / 100,
        activeMinutes: Math.round(today.activeMin),
        exerciseCount: today.exercises,
        source: 'HEALTH_CONNECT',
    });

    await SecureStore.setItemAsync(SYNC_KEY, String(Date.now()));
}

/** Auto-sync on mount (throttled, today only) */
export function useActivitySync() {
    const api = useApiClient();
    const ran = useRef(false);

    useEffect(() => {
        if (ran.current) return;
        ran.current = true;

        (async () => {
            const last = await SecureStore.getItemAsync(SYNC_KEY);
            if (last && Date.now() - parseInt(last) < SYNC_INTERVAL) return;

            try {
                await syncToday(api);
            } catch {
                // silent fail
            }
        })();
    }, [api]);
}

/** Manual sync trigger (today only, ignores throttle) */
export function useManualSync() {
    const api = useApiClient();
    const [isSyncing, setIsSyncing] = useState(false);

    const sync = useCallback(async () => {
        setIsSyncing(true);
        try {
            await syncToday(api);
        } finally {
            setIsSyncing(false);
        }
    }, [api]);

    return { sync, isSyncing };
}
