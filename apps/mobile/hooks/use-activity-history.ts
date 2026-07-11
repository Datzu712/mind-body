import type { DailyActivity } from '@/lib/api/activity';
import { dayKey, startOfWeek, startOfMonth, ACTIVE_STEPS_THRESHOLD } from '@/lib/date-utils';
import { useActivityRecords } from './use-health-data';

export { useActivityRecords as useActivityHistory };

export type Period = 'week' | 'month' | '3months';

export const ActivityType = {
    REST: 0,
    WORKOUT: 1,
    ACTIVE: 2,
} as const;

export type ActivityTypeValue = (typeof ActivityType)[keyof typeof ActivityType];

export interface BarData {
    label: string;
    value: number;
    isCurrent: boolean;
}

export interface MonthDay {
    day: number;
    type: ActivityTypeValue;
}

export interface PeriodSummary {
    totalSteps: number;
    totalCalories: number;
    totalExercises: number;
    totalActiveMinutes: number;
}

const WEEKDAY_LABELS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

function filterRange(records: DailyActivity[], from: string, to: string): DailyActivity[] {
    return records.filter((r) => r.date >= from && r.date <= to);
}

function summarize(records: DailyActivity[]): PeriodSummary {
    let totalSteps = 0;
    let totalCalories = 0;
    let totalExercises = 0;
    let totalActiveMinutes = 0;
    for (const r of records) {
        totalSteps += r.steps;
        totalCalories += parseFloat(r.caloriesTotal);
        totalExercises += r.exerciseCount;
        totalActiveMinutes += r.activeMinutes;
    }
    return {
        totalSteps,
        totalCalories: Math.round(totalCalories),
        totalExercises,
        totalActiveMinutes: Math.round(totalActiveMinutes),
    };
}

// ── Week: bar per day (L-D) ─────────────────────────────────────────────────

export function computeWeekBars(records: DailyActivity[], metric: 'steps' | 'calories'): BarData[] {
    const now = new Date();
    const ws = startOfWeek(now);
    const today = dayKey(now);

    const byDate = new Map<string, DailyActivity>();
    for (const r of records) byDate.set(r.date, r);

    return WEEKDAY_LABELS.map((label, i) => {
        const d = new Date(ws);
        d.setDate(d.getDate() + i);
        const key = dayKey(d);
        const rec = byDate.get(key);
        const value = metric === 'steps' ? (rec?.steps ?? 0) : Math.round(parseFloat(rec?.caloriesTotal ?? '0'));
        return { label, value, isCurrent: key === today };
    });
}

export function computeWeekSummary(records: DailyActivity[]): PeriodSummary {
    const ws = dayKey(startOfWeek(new Date()));
    const now = dayKey(new Date());
    return summarize(filterRange(records, ws, now));
}

// ── Month: bar per week (S1-S4/S5) ─────────────────────────────────────────

export function computeMonthBars(records: DailyActivity[], metric: 'steps' | 'calories'): BarData[] {
    const now = new Date();
    const ms = startOfMonth(now);
    const today = dayKey(now);
    const bars: BarData[] = [];

    let weekStart = new Date(ms);
    let weekNum = 1;

    while (dayKey(weekStart) <= today) {
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        const weKey = dayKey(weekEnd) > today ? today : dayKey(weekEnd);
        const wsKey = dayKey(weekStart);

        const weekRecords = filterRange(records, wsKey, weKey);
        let value: number;
        if (metric === 'steps') {
            value = weekRecords.reduce((s, r) => s + r.steps, 0);
        } else {
            value = Math.round(weekRecords.reduce((s, r) => s + parseFloat(r.caloriesTotal), 0));
        }

        bars.push({ label: `S${weekNum}`, value, isCurrent: weKey === today });
        weekStart = new Date(weekEnd);
        weekStart.setDate(weekStart.getDate() + 1);
        weekNum++;
    }

    return bars;
}

export function computeMonthSummary(records: DailyActivity[]): PeriodSummary {
    const ms = dayKey(startOfMonth(new Date()));
    const now = dayKey(new Date());
    return summarize(filterRange(records, ms, now));
}

// ── 3 Months: bar per month ────────────────────────────────────────────────

const MONTH_NAMES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

export function compute3MonthBars(records: DailyActivity[], metric: 'steps' | 'calories'): BarData[] {
    const now = new Date();
    const bars: BarData[] = [];

    for (let i = 2; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0);
        const msKey = dayKey(d);
        const meKey = i === 0 ? dayKey(now) : dayKey(monthEnd);

        const monthRecords = filterRange(records, msKey, meKey);
        let value: number;
        if (metric === 'steps') {
            value = monthRecords.reduce((s, r) => s + r.steps, 0);
        } else {
            value = Math.round(monthRecords.reduce((s, r) => s + parseFloat(r.caloriesTotal), 0));
        }

        bars.push({ label: MONTH_NAMES[d.getMonth()], value, isCurrent: i === 0 });
    }

    return bars;
}

export function compute3MonthSummary(records: DailyActivity[]): PeriodSummary {
    const now = new Date();
    const from = new Date(now.getFullYear(), now.getMonth() - 2, 1);
    return summarize(filterRange(records, dayKey(from), dayKey(now)));
}

// ── Month calendar ──────────────────────────────────────────────────────────

export function computeMonthActivity(records: DailyActivity[]): MonthDay[] {
    const now = new Date();
    const today = now.getDate();

    const byDate = new Map<string, DailyActivity>();
    for (const r of records) byDate.set(r.date, r);

    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const days: MonthDay[] = [];

    for (let d = 1; d <= Math.min(daysInMonth, today); d++) {
        const key = dayKey(new Date(now.getFullYear(), now.getMonth(), d));
        const rec = byDate.get(key);
        let type: ActivityTypeValue = ActivityType.REST;
        if (rec) {
            if (rec.exerciseCount > 0) type = ActivityType.WORKOUT;
            else if (rec.steps >= ACTIVE_STEPS_THRESHOLD) type = ActivityType.ACTIVE;
        }
        days.push({ day: d, type });
    }

    return days;
}
