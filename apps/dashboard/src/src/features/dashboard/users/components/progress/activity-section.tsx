import { useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { cn } from '@/lib/utils';
import { useMemberActivity } from '../../hooks';
import type { DailyActivity } from '../../types';
import {
    ACTIVITY_METRICS,
    ACTIVITY_PERIODS,
    activityRange,
    fmtWeekday,
    fmtShortDate,
    fmtMonth,
    type ActivityMetricKey,
    type ActivityPeriodKey,
} from './constants';

const chartConfig = {
    value: { label: 'Valor', color: 'var(--chart-2)' },
} satisfies ChartConfig;

const numeric = (v: string | number) => (typeof v === 'string' ? Number(v) || 0 : v);

/** Aggregate daily rows into chart buckets sized to the period. */
function buckets(rows: DailyActivity[], metric: ActivityMetricKey, period: ActivityPeriodKey) {
    const asc = [...rows].sort((a, b) => a.date.localeCompare(b.date));
    const keyOf = (iso: string) => {
        if (period === 'week') return iso; // per day
        if (period === '3months') return iso.slice(0, 7); // per month (YYYY-MM)
        return iso.slice(0, 7) + '-' + Math.ceil(Number(iso.slice(8, 10)) / 7); // ~per week of month
    };
    const labelOf = (iso: string) =>
        period === 'week' ? fmtWeekday(iso) : period === '3months' ? fmtMonth(iso) : fmtShortDate(iso);

    const acc = new Map<string, { label: string; value: number }>();
    for (const r of asc) {
        const k = keyOf(r.date);
        const prev = acc.get(k);
        const value = numeric(r[metric]);
        if (prev) prev.value += value;
        else acc.set(k, { label: labelOf(r.date), value });
    }
    return [...acc.values()];
}

function totals(rows: DailyActivity[]) {
    return rows.reduce(
        (t, r) => ({
            steps: t.steps + r.steps,
            caloriesTotal: t.caloriesTotal + numeric(r.caloriesTotal),
            activeMinutes: t.activeMinutes + r.activeMinutes,
            exerciseCount: t.exerciseCount + r.exerciseCount,
        }),
        { steps: 0, caloriesTotal: 0, activeMinutes: 0, exerciseCount: 0 },
    );
}

const fmtInt = (n: number) => Math.round(n).toLocaleString('es-CR');

export function ActivitySection({ userId }: { userId: string }) {
    const [metric, setMetric] = useState<ActivityMetricKey>('steps');
    const [period, setPeriod] = useState<ActivityPeriodKey>('week');

    const range = activityRange(period);
    const activity = useMemberActivity(userId, range.from, range.to);

    const rows = activity.data ?? [];
    const data = useMemo(() => buckets(rows, metric, period), [rows, metric, period]);
    const sums = useMemo(() => totals(rows), [rows]);
    const metricLabel = ACTIVITY_METRICS.find((m) => m.key === metric)!.label;

    if (activity.isLoading) {
        return <Skeleton className="h-72 w-full" />;
    }

    if (rows.length === 0) {
        return (
            <Card className="border-border bg-card">
                <CardContent className="py-10 text-center text-sm text-muted-foreground">
                    Este miembro aún no tiene actividad registrada. La actividad se sincroniza desde la app móvil
                    (Health Connect).
                </CardContent>
            </Card>
        );
    }

    return (
        // Chart on the left, the period totals as a compact 2×2 grid on the right.
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
            <Card size="sm" className="border-border bg-card">
                <CardHeader>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <CardTitle className="text-base">Actividad</CardTitle>
                        <div className="flex flex-wrap items-center gap-1.5">
                            {ACTIVITY_METRICS.map((m) => (
                                <Button
                                    key={m.key}
                                    size="sm"
                                    variant={metric === m.key ? 'default' : 'outline'}
                                    onClick={() => setMetric(m.key)}
                                >
                                    {m.label}
                                </Button>
                            ))}
                            <span className="mx-1 h-5 w-px bg-border" />
                            {ACTIVITY_PERIODS.map((p) => (
                                <Button
                                    key={p.key}
                                    size="sm"
                                    variant={period === p.key ? 'secondary' : 'ghost'}
                                    className={cn(period === p.key && 'font-semibold')}
                                    onClick={() => setPeriod(p.key)}
                                >
                                    {p.label}
                                </Button>
                            ))}
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <ChartContainer config={chartConfig} className="h-44 w-full">
                        <BarChart data={data} margin={{ left: 4, right: 12, top: 8, bottom: 4 }}>
                            <CartesianGrid vertical={false} />
                            <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
                            <YAxis width={44} tickLine={false} axisLine={false} />
                            <ChartTooltip
                                content={
                                    <ChartTooltipContent
                                        formatter={(value) => `${fmtInt(Number(value))} ${metricLabel}`}
                                    />
                                }
                            />
                            <Bar dataKey="value" name={metricLabel} fill="var(--color-value)" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ChartContainer>
                </CardContent>
            </Card>

            <Card size="sm" className="border-border bg-card">
                <CardHeader>
                    <CardTitle className="text-base">Totales del período</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-2">
                    <Total label="Pasos" value={fmtInt(sums.steps)} />
                    <Total label="Calorías" value={fmtInt(sums.caloriesTotal)} />
                    <Total label="Min. activos" value={fmtInt(sums.activeMinutes)} />
                    <Total label="Ejercicios" value={fmtInt(sums.exerciseCount)} />
                </CardContent>
            </Card>
        </div>
    );
}

function Total({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex flex-col gap-0.5 rounded-lg border border-border/60 bg-muted/30 p-2.5">
            <span className="text-xs text-muted-foreground">{label}</span>
            <span className="text-lg font-semibold tabular-nums text-foreground">{value}</span>
        </div>
    );
}
