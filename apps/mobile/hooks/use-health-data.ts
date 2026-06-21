import { useQuery } from '@tanstack/react-query';

import { useApiClient } from '@/lib/api/client';
import { getDailyActivityRange } from '@/lib/api/activity';
import type { DailyActivity } from '@/lib/api/activity';
import { dayKey, startOfWeek, startOfMonth, ACTIVE_STEPS_THRESHOLD } from '@/lib/date-utils';

export interface HealthData {
    stepsToday: number;
    caloriesWeek: number;
    exercisesMonth: number;
    exercisesWeek: number;
    activeMinutesWeek: number;
    currentStreak: number;
    bestStreak: number;
    isLoading: boolean;
}

export const ACTIVITY_QUERY_DAYS = 90;

export function useActivityRecords() {
    const api = useApiClient();
    const now = new Date();
    const from = new Date(now);
    from.setDate(from.getDate() - ACTIVITY_QUERY_DAYS);

    return useQuery({
        queryKey: ['activity', 'history', dayKey(now)],
        queryFn: () => getDailyActivityRange(api, dayKey(from), dayKey(now)),
        staleTime: 5 * 60 * 1000,
    });
}

function computeStats(records: DailyActivity[], now: Date): Omit<HealthData, 'isLoading'> {
    const today = dayKey(now);
    const weekStartKey = dayKey(startOfWeek(now));
    const monthStartKey = dayKey(startOfMonth(now));

    const byDate = new Map<string, DailyActivity>();
    for (const r of records) byDate.set(r.date, r);

    const todayRec = byDate.get(today);
    const stepsToday = todayRec?.steps ?? 0;

    let caloriesWeek = 0;
    let exercisesMonth = 0;
    let exercisesWeek = 0;
    let activeMinutesWeek = 0;

    for (const r of records) {
        if (r.date >= weekStartKey) {
            caloriesWeek += parseFloat(r.caloriesTotal);
            exercisesWeek += r.exerciseCount;
            activeMinutesWeek += r.activeMinutes;
        }
        if (r.date >= monthStartKey) {
            exercisesMonth += r.exerciseCount;
        }
    }

    // Streaks — check consecutive calendar days, not just consecutive records
    let currentStreak = 0;
    const d = new Date(now);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - 1);
    for (let i = 0; i < ACTIVITY_QUERY_DAYS; i++) {
        const rec = byDate.get(dayKey(d));
        if (rec && rec.steps >= ACTIVE_STEPS_THRESHOLD) {
            currentStreak++;
        } else break;
        d.setDate(d.getDate() - 1);
    }
    if (todayRec && todayRec.steps >= ACTIVE_STEPS_THRESHOLD) currentStreak++;

    let bestStreak = 0;
    let temp = 0;
    const checkDate = new Date(now);
    checkDate.setHours(0, 0, 0, 0);
    checkDate.setDate(checkDate.getDate() - ACTIVITY_QUERY_DAYS);
    for (let i = 0; i <= ACTIVITY_QUERY_DAYS; i++) {
        const rec = byDate.get(dayKey(checkDate));
        if (rec && rec.steps >= ACTIVE_STEPS_THRESHOLD) {
            temp++;
            if (temp > bestStreak) bestStreak = temp;
        } else {
            temp = 0;
        }
        checkDate.setDate(checkDate.getDate() + 1);
    }

    return {
        stepsToday,
        caloriesWeek: Math.round(caloriesWeek),
        exercisesMonth,
        exercisesWeek,
        activeMinutesWeek: Math.round(activeMinutesWeek),
        currentStreak,
        bestStreak,
    };
}

const EMPTY: HealthData = {
    stepsToday: 0,
    caloriesWeek: 0,
    exercisesMonth: 0,
    exercisesWeek: 0,
    activeMinutesWeek: 0,
    currentStreak: 0,
    bestStreak: 0,
    isLoading: true,
};

export function useHealthData(): HealthData {
    const { data: records, isLoading } = useActivityRecords();

    if (isLoading || !records) return EMPTY;

    return { ...computeStats(records, new Date()), isLoading: false };
}
