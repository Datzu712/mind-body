import { ArrowDown, ArrowUp, Minus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { MeasurementSummary } from '../../types';
import { METRICS, deltaTone, fmtMetric, fmtSignedDelta, fmtLongDate } from './constants';
import { MeasurementHistoryDialog } from './measurement-history-dialog';

const toneClass: Record<'good' | 'bad' | 'neutral', string> = {
    good: 'text-success',
    bad: 'text-destructive',
    neutral: 'text-muted-foreground',
};

function ToneIcon({ tone }: { tone: 'good' | 'bad' | 'neutral' }) {
    if (tone === 'good') return <ArrowDown className="h-3.5 w-3.5" />;
    if (tone === 'bad') return <ArrowUp className="h-3.5 w-3.5" />;
    return <Minus className="h-3.5 w-3.5" />;
}

export function MeasurementComparisonCard({ summary, userId }: { summary: MeasurementSummary; userId: string }) {
    const { first, latest, variations, totalRecords } = summary;

    return (
        <Card size="sm" className="border-border bg-card">
            <CardHeader>
                <CardTitle className="text-base">Evolución</CardTitle>
                {first && latest && (
                    <p className="text-xs text-muted-foreground">
                        {fmtLongDate(first.measuredAt)} → {fmtLongDate(latest.measuredAt)}
                    </p>
                )}
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
                {METRICS.map((m) => {
                    const delta = variations[m.key];
                    const tone = deltaTone(delta, m.key);
                    return (
                        <div
                            key={m.key}
                            className="grid grid-cols-[1fr_auto] items-center gap-2 border-b border-border/60 pb-1.5 last:border-0 last:pb-0"
                        >
                            <div className="flex flex-col">
                                <span className="text-sm font-medium text-foreground">{m.label}</span>
                                <span className="text-xs text-muted-foreground">
                                    {fmtMetric(first?.[m.key] ?? null, m.unit)} →{' '}
                                    {fmtMetric(latest?.[m.key] ?? null, m.unit)}
                                </span>
                            </div>
                            <div className={cn('flex items-center gap-1 text-sm font-medium', toneClass[tone])}>
                                <ToneIcon tone={tone} />
                                {fmtSignedDelta(delta, m.unit)}
                            </div>
                        </div>
                    );
                })}
                <div className="pt-1">
                    <MeasurementHistoryDialog userId={userId} totalRecords={totalRecords} />
                </div>
            </CardContent>
        </Card>
    );
}
