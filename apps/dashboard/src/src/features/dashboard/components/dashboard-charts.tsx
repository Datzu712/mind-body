import type { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { usePopularClasses, useReservationsTrend } from '../stats/hooks';

const GRID = 'oklch(0.28 0.005 260)';
const AXIS_TEXT = 'oklch(0.65 0 0)';
const ACCENT = 'oklch(0.85 0.18 85)';

const TOOLTIP_STYLE = {
    backgroundColor: 'oklch(0.17 0.005 260)',
    border: `1px solid ${GRID}`,
    borderRadius: '8px',
    color: 'oklch(0.97 0 0)',
};

/** Shared chart shell so loading, failure and empty never render an axis-less blank box. */
function ChartCard({
    title,
    isLoading,
    isError,
    isEmpty,
    children,
}: {
    title: string;
    isLoading: boolean;
    isError: boolean;
    isEmpty: boolean;
    children: ReactNode;
}) {
    return (
        <Card className="border-border bg-card">
            <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold">{title}</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-[250px] w-full">
                    {isLoading && <div className="h-full w-full animate-pulse rounded-md bg-muted/40" />}
                    {!isLoading && isError && (
                        <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                            No se pudieron cargar los datos.
                        </div>
                    )}
                    {!isLoading && !isError && isEmpty && (
                        <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                            Todavía no hay datos suficientes.
                        </div>
                    )}
                    {!isLoading && !isError && !isEmpty && (
                        <ResponsiveContainer width="100%" height="100%">
                            {children as React.ReactElement}
                        </ResponsiveContainer>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

/** 'YYYY-MM-DD' → '4 ago'. Parsed as local time so the bucket keeps its business date. */
function weekLabel(week: string): string {
    return new Intl.DateTimeFormat('es-CR', { day: 'numeric', month: 'short' }).format(new Date(`${week}T00:00:00`));
}

export function ReservationsTrendChart() {
    const { data, isLoading, isError } = useReservationsTrend(8);
    const points = (data ?? []).map((point) => ({ ...point, label: weekLabel(point.week) }));

    return (
        <ChartCard title="Reservas por semana" isLoading={isLoading} isError={isError} isEmpty={points.length === 0}>
            <AreaChart data={points} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                    <linearGradient id="colorReservations" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={ACCENT} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={ACCENT} stopOpacity={0} />
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: AXIS_TEXT, fontSize: 12 }} />
                <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: AXIS_TEXT, fontSize: 12 }}
                    allowDecimals={false}
                />
                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(value) => [value, 'Reservas']} />
                <Area
                    type="monotone"
                    dataKey="total"
                    stroke={ACCENT}
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorReservations)"
                />
            </AreaChart>
        </ChartCard>
    );
}

export function ClassPopularityChart() {
    const { data, isLoading, isError } = usePopularClasses(5, 30);
    const points = data ?? [];

    return (
        <ChartCard title="Clases con más demanda" isLoading={isLoading} isError={isError} isEmpty={points.length === 0}>
            <BarChart data={points} layout="vertical" margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={GRID} horizontal={false} />
                <XAxis
                    type="number"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: AXIS_TEXT, fontSize: 12 }}
                    allowDecimals={false}
                />
                <YAxis
                    type="category"
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: AXIS_TEXT, fontSize: 11 }}
                    width={120}
                />
                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(value) => [value, 'Reservas']} />
                <Bar dataKey="total" fill={ACCENT} radius={[0, 4, 4, 0]} />
            </BarChart>
        </ChartCard>
    );
}

// TODO(memberships): third slot goes to a membership-status breakdown (activas /
// por vencer / vencidas) once the memberships module exposes an endpoint. The old
// plan-distribution donut was removed: it charted mock plans, and with in-person
// payments there are no real tiers to break down.
