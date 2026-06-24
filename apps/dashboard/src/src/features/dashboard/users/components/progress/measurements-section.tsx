import { useMemo, useState } from 'react';
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { cn } from '@/lib/utils';
import { useMemberMeasurements, useMemberMeasurementSummary } from '../../hooks';
import type { Measurement } from '../../types';
import { MeasurementComparisonCard } from './measurement-comparison-card';
import {
    METRICS,
    MEASUREMENT_PERIODS,
    measurementRange,
    fmtMonth,
    type MetricKey,
    type MeasurementPeriodKey,
} from './constants';

const chartConfig = {
    value: { label: 'Valor', color: 'var(--chart-1)' },
} satisfies ChartConfig;

/** Last measurement per month for the selected metric, oldest → newest. */
function monthlySeries(rows: Measurement[], metric: MetricKey) {
    const byMonth = new Map<string, Measurement>();
    // rows arrive newest-first; keep the first (latest) seen per month bucket.
    for (const r of rows) {
        if (r[metric] == null) continue;
        const bucket = r.measuredAt.slice(0, 7); // YYYY-MM
        if (!byMonth.has(bucket)) byMonth.set(bucket, r);
    }
    return [...byMonth.values()]
        .sort((a, b) => a.measuredAt.localeCompare(b.measuredAt))
        .map((r) => ({ label: fmtMonth(r.measuredAt), value: Number(r[metric]) }));
}

export function MeasurementsSection({ userId }: { userId: string }) {
    const [metric, setMetric] = useState<MetricKey>('weightKg');
    const [period, setPeriod] = useState<MeasurementPeriodKey>('6m');

    const range = measurementRange(period);
    const measurements = useMemberMeasurements(userId, range.from, range.to);
    const summary = useMemberMeasurementSummary(userId);

    const rows = measurements.data ?? [];
    const series = useMemo(() => monthlySeries(rows, metric), [rows, metric]);
    const metricMeta = METRICS.find((m) => m.key === metric)!;

    const isLoading = measurements.isLoading || summary.isLoading;
    const hasAnyData = (summary.data?.totalRecords ?? 0) > 0;

    if (isLoading) {
        return <Skeleton className="h-72 w-full" />;
    }

    if (!hasAnyData) {
        return (
            <Card className="border-border bg-card">
                <CardContent className="py-10 text-center text-sm text-muted-foreground">
                    Este miembro aún no tiene mediciones registradas.
                </CardContent>
            </Card>
        );
    }

    return (
        // Chart + comparison sit side by side on wide screens. The full history lives
        // behind the "Mostrar más..." link in the comparison card (modal), keeping the tab compact.
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
            <Card size="sm" className="border-border bg-card">
                <CardHeader>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <CardTitle className="text-base">Mediciones corporales</CardTitle>
                        <div className="flex flex-wrap items-center gap-1.5">
                            {METRICS.map((m) => (
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
                            {MEASUREMENT_PERIODS.map((p) => (
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
                    {series.length < 2 ? (
                        <div className="py-10 text-center text-sm text-muted-foreground">
                            Se necesitan al menos 2 mediciones de {metricMeta.label.toLowerCase()} en este período para
                            mostrar el gráfico.
                        </div>
                    ) : (
                        <ChartContainer config={chartConfig} className="h-44 w-full">
                            <LineChart data={series} margin={{ left: 4, right: 12, top: 8, bottom: 4 }}>
                                <CartesianGrid vertical={false} />
                                <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
                                <YAxis
                                    width={44}
                                    tickLine={false}
                                    axisLine={false}
                                    domain={['dataMin - 1', 'dataMax + 1']}
                                    tickFormatter={(v: number) => `${v}`}
                                />
                                <ChartTooltip
                                    content={
                                        <ChartTooltipContent
                                            formatter={(value) => `${Number(value)} ${metricMeta.unit}`}
                                        />
                                    }
                                />
                                <Line
                                    dataKey="value"
                                    name={metricMeta.label}
                                    type="monotone"
                                    stroke="var(--color-value)"
                                    strokeWidth={2}
                                    dot={{ r: 3 }}
                                    activeDot={{ r: 5 }}
                                />
                            </LineChart>
                        </ChartContainer>
                    )}
                </CardContent>
            </Card>

            {summary.data && <MeasurementComparisonCard summary={summary.data} userId={userId} />}
        </div>
    );
}
