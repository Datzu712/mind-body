import { useCallback, useEffect, useRef, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { initialize, readRecords, aggregateRecord, getGrantedPermissions } from 'react-native-health-connect';
import { useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

import { useApiClient } from '@/lib/api/client';
import { upsertDailyActivity } from '@/lib/api/activity';
import { ACTIVITY_QUERY_KEY } from '@/hooks/use-health-data';
import { dayKey, startOfDay, endOfDay } from '@/lib/date-utils';

const SYNC_KEY = 'last_hc_sync';
const SYNC_INTERVAL = 12 * 60 * 60 * 1000; // 12h (temporal: evita re-sync hasta la PoC)

async function readHCTotals(from: Date, to: Date) {
    const timeRangeFilter = {
        operator: 'between' as const,
        startTime: from.toISOString(),
        endTime: to.toISOString(),
    };

    // aggregateRecord applies Health Connect's data-source priority list, so steps/calories that
    // several apps record for the same period (Samsung Health + Google Fit + the Android system,
    // etc.) are de-duplicated. readRecords returns every source's raw records — summing them
    // multiplied the real total (186 steps were being reported as ~558).
    const [steps, calories, exRes] = await Promise.all([
        aggregateRecord({ recordType: 'Steps', timeRangeFilter }).catch(() => null),
        aggregateRecord({ recordType: 'TotalCaloriesBurned', timeRangeFilter }).catch(() => null),
        readRecords('ExerciseSession', { timeRangeFilter }).catch(() => ({ records: [] })),
    ]);

    const activeMin = exRes.records.reduce(
        (sum, r) => sum + (new Date(r.endTime).getTime() - new Date(r.startTime).getTime()) / 60000,
        0,
    );

    return {
        steps: steps?.COUNT_TOTAL ?? 0,
        calories: calories?.ENERGY_TOTAL?.inKilocalories ?? 0,
        activeMin,
        exercises: exRes.records.length,
    };
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

/** Sync only today to backend. Returns true when data was actually pushed. */
async function syncToday(api: (path: string, options?: RequestInit) => Promise<Response>): Promise<boolean> {
    if (!(await ensureHC())) return false;

    const now = new Date();
    const todayStart = startOfDay(now);
    // Query the whole local day, not [midnight, now]. Some sources (Samsung Health) write a single
    // record whose time envelope spans the full day; Health Connect prorates a record's count by how
    // much it overlaps the query window, so cutting at `now` scaled that daily record down (94 steps
    // instead of 234). The full-day window contains it whole, and future steps don't exist yet.
    const today = await readHCTotals(todayStart, endOfDay(now));

    await upsertDailyActivity(api, {
        date: dayKey(todayStart),
        steps: today.steps,
        caloriesTotal: Math.round(today.calories * 100) / 100,
        activeMinutes: Math.round(today.activeMin),
        exerciseCount: today.exercises,
        source: 'HEALTH_CONNECT',
    });

    await SecureStore.setItemAsync(SYNC_KEY, String(Date.now()));
    return true;
}

/** Auto-sync on mount (throttled, today only) */
export function useActivitySync() {
    const api = useApiClient();
    const qc = useQueryClient();
    const ran = useRef(false);

    useEffect(() => {
        if (ran.current) return;
        ran.current = true;

        (async () => {
            const last = await SecureStore.getItemAsync(SYNC_KEY);
            if (last && Date.now() - parseInt(last) < SYNC_INTERVAL) return;

            try {
                if (await syncToday(api)) {
                    await qc.invalidateQueries({ queryKey: ACTIVITY_QUERY_KEY });
                }
            } catch {
                // silent fail
            }
        })();
    }, [api, qc]);
}

/** Manual sync trigger (today only, ignores throttle) */
export function useManualSync() {
    const api = useApiClient();
    const qc = useQueryClient();
    const [isSyncing, setIsSyncing] = useState(false);
    const [lastResult, setLastResult] = useState<'success' | 'error' | null>(null);
    const [lastSyncAt, setLastSyncAt] = useState<number | null>(null);

    useEffect(() => {
        SecureStore.getItemAsync(SYNC_KEY).then((v) => {
            if (v) setLastSyncAt(parseInt(v));
        });
    }, []);

    const sync = useCallback(async () => {
        setIsSyncing(true);
        setLastResult(null);
        try {
            if (await syncToday(api)) {
                await qc.invalidateQueries({ queryKey: ACTIVITY_QUERY_KEY });
            }
            setLastSyncAt(Date.now());
            setLastResult('success');
        } catch {
            setLastResult('error');
        } finally {
            setIsSyncing(false);
        }
    }, [api, qc]);

    useEffect(() => {
        if (!lastResult) return;
        const t = setTimeout(() => setLastResult(null), 3000);
        return () => clearTimeout(t);
    }, [lastResult]);

    const lastSyncLabel = lastSyncAt ? `Hace ${formatDistanceToNow(lastSyncAt, { locale: es })}` : null;

    return { sync, isSyncing, lastResult, lastSyncLabel };
}
