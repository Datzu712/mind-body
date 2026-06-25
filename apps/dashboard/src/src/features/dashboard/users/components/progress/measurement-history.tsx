import { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, ArrowDownUp, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import type { Measurement } from '../../types';
import {
    METRICS,
    MEASUREMENT_PERIODS,
    measurementRange,
    deltaTone,
    fmtLongDate,
    fmtWeekday,
    type MeasurementPeriodKey,
    type MetricKey,
} from './constants';

type Tone = 'good' | 'bad' | 'neutral';
const toneClass: Record<Tone, string> = {
    good: 'text-success',
    bad: 'text-destructive',
    neutral: 'text-muted-foreground',
};

/** Per-row delta vs the chronologically previous measurement, keyed by row id. */
function computeDeltas(rows: Measurement[]) {
    const asc = [...rows].sort((a, b) => a.measuredAt.localeCompare(b.measuredAt));
    const deltas = new Map<string, Partial<Record<MetricKey, number>>>();
    for (let i = 1; i < asc.length; i++) {
        const cur = asc[i];
        const prev = asc[i - 1];
        const d: Partial<Record<MetricKey, number>> = {};
        for (const m of METRICS) {
            const a = prev[m.key];
            const b = cur[m.key];
            if (a != null && b != null) d[m.key] = +(Number(b) - Number(a)).toFixed(1);
        }
        deltas.set(cur.id, d);
    }
    return deltas;
}

function TrendDelta({ value, metric }: { value: number | undefined; metric: MetricKey }) {
    if (value == null || value === 0) return null;
    const tone = deltaTone(value, metric);
    const sign = value > 0 ? '+' : '';
    return (
        <span className={cn('flex items-center justify-end gap-0.5 text-[11px] leading-none', toneClass[tone])}>
            {tone === 'good' ? (
                <ArrowDown className="h-3 w-3" />
            ) : tone === 'bad' ? (
                <ArrowUp className="h-3 w-3" />
            ) : null}
            {sign}
            {value.toLocaleString('es-CR', { maximumFractionDigits: 1 })}
        </span>
    );
}

/** Read-only, filterable measurement history for the modal. Filtering/sorting is
 *  client-side over the full set the dialog passes in. */
export function MeasurementHistoryTable({ rows }: { rows: Measurement[] }) {
    const [period, setPeriod] = useState<MeasurementPeriodKey>('all');
    const [sortDir, setSortDir] = useState<'desc' | 'asc'>('desc');
    const [query, setQuery] = useState('');

    const deltas = useMemo(() => computeDeltas(rows), [rows]);
    const latestId = useMemo(() => [...rows].sort((a, b) => b.measuredAt.localeCompare(a.measuredAt))[0]?.id, [rows]);

    const filtered = useMemo(() => {
        const { from, to } = measurementRange(period);
        const q = query.trim().toLowerCase();
        return rows
            .filter((r) => (!from || r.measuredAt >= from) && (!to || r.measuredAt <= to))
            .filter((r) => !q || (r.notes ?? '').toLowerCase().includes(q))
            .sort((a, b) =>
                sortDir === 'desc'
                    ? b.measuredAt.localeCompare(a.measuredAt)
                    : a.measuredAt.localeCompare(b.measuredAt),
            );
    }, [rows, period, query, sortDir]);

    return (
        <div className="flex flex-col gap-3">
            {/* Toolbar: search · period · sort */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative sm:w-56">
                    <Search className="text-muted-foreground absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2" />
                    <Input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Buscar en notas..."
                        className="h-9 pl-8"
                    />
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="bg-muted/50 flex items-center rounded-md p-0.5">
                        {MEASUREMENT_PERIODS.map((p) => (
                            <button
                                key={p.key}
                                type="button"
                                onClick={() => setPeriod(p.key)}
                                className={cn(
                                    'rounded px-2.5 py-1 text-xs font-medium transition-colors',
                                    period === p.key
                                        ? 'bg-background text-foreground shadow-sm'
                                        : 'text-muted-foreground hover:text-foreground',
                                )}
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-9 gap-1.5"
                        onClick={() => setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'))}
                    >
                        <ArrowDownUp className="h-3.5 w-3.5" />
                        {sortDir === 'desc' ? 'Recientes' : 'Antiguas'}
                    </Button>
                </div>
            </div>

            <p className="text-muted-foreground text-xs">
                Mostrando {filtered.length} de {rows.length} mediciones
            </p>

            <div className="rounded-lg border border-border">
                <ScrollArea className="h-[55vh]">
                    <Table>
                        <TableHeader className="bg-card sticky top-0 z-10">
                            <TableRow className="hover:bg-transparent">
                                <TableHead className="pl-4">Fecha</TableHead>
                                {METRICS.map((m) => (
                                    <TableHead key={m.key} className="text-right">
                                        {m.label}
                                        <span className="text-muted-foreground ml-1 font-normal">({m.unit})</span>
                                    </TableHead>
                                ))}
                                <TableHead className="pr-4">Notas</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filtered.length === 0 ? (
                                <TableRow className="hover:bg-transparent">
                                    <TableCell
                                        colSpan={METRICS.length + 2}
                                        className="text-muted-foreground py-12 text-center text-sm"
                                    >
                                        No hay mediciones que coincidan con los filtros.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filtered.map((r) => {
                                    const rowDeltas = deltas.get(r.id);
                                    const isLatest = r.id === latestId;
                                    return (
                                        <TableRow key={r.id} className="even:bg-muted/20">
                                            <TableCell className="pl-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium">{fmtLongDate(r.measuredAt)}</span>
                                                    <span className="text-muted-foreground text-xs capitalize">
                                                        {fmtWeekday(r.measuredAt)}
                                                    </span>
                                                    {isLatest && (
                                                        <Badge
                                                            variant="outline"
                                                            className="border-primary/30 bg-primary/10 text-primary text-[10px]"
                                                        >
                                                            Más reciente
                                                        </Badge>
                                                    )}
                                                </div>
                                            </TableCell>
                                            {METRICS.map((m) => (
                                                <TableCell key={m.key} className="text-right whitespace-nowrap">
                                                    <span className="inline-flex items-center justify-end gap-1.5">
                                                        <span className="tabular-nums">
                                                            {r[m.key] == null
                                                                ? '—'
                                                                : Number(r[m.key]).toLocaleString('es-CR', {
                                                                      maximumFractionDigits: 1,
                                                                  })}
                                                        </span>
                                                        <TrendDelta value={rowDeltas?.[m.key]} metric={m.key} />
                                                    </span>
                                                </TableCell>
                                            ))}
                                            <TableCell className="text-muted-foreground max-w-[16rem] truncate pr-4">
                                                {r.notes || '—'}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </ScrollArea>
            </div>
        </div>
    );
}
