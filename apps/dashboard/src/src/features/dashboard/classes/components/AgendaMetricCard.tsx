import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

type Tone = 'primary' | 'success' | 'warning' | 'destructive';

const toneClasses: Record<Tone, { wrap: string; icon: string }> = {
    primary: { wrap: 'bg-primary/10', icon: 'text-primary' },
    success: { wrap: 'bg-success/10', icon: 'text-success' },
    warning: { wrap: 'bg-warning/10', icon: 'text-warning' },
    destructive: { wrap: 'bg-destructive/10', icon: 'text-destructive' },
};

interface AgendaMetricCardProps {
    label: string;
    value: string | number;
    icon: LucideIcon;
    tone?: Tone;
    /** Small caption under the value (e.g. "Confirmadas"). */
    caption?: string;
}

/** Compact KPI card for the trainer agenda header. */
export function AgendaMetricCard({ label, value, icon: Icon, tone = 'primary', caption }: AgendaMetricCardProps) {
    const t = toneClasses[tone];
    return (
        <Card className="border-border bg-card">
            <CardContent className="flex items-center gap-4 p-4">
                <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg', t.wrap)}>
                    <Icon className={cn('h-5 w-5', t.icon)} aria-hidden />
                </div>
                <div className="flex flex-col">
                    <p className="text-sm text-muted-foreground">{label}</p>
                    <p className="text-2xl font-bold text-foreground">{value}</p>
                    {caption && <p className={cn('text-xs font-medium', t.icon)}>{caption}</p>}
                </div>
            </CardContent>
        </Card>
    );
}
