import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SessionOccupancy } from '../types';

function occupancyTone(session: SessionOccupancy): string {
    if (session.booked >= session.capacity) return 'text-destructive';
    if (session.booked / session.capacity >= 0.8) return 'text-warning';
    return 'text-success';
}

interface SessionCardProps {
    session: SessionOccupancy;
    onClick: () => void;
}

/** Tarjeta compacta de una sesión dentro de la grilla semanal. */
export function SessionCard({ session, onClick }: SessionCardProps) {
    const cancelled = session.status === 'cancelada';
    return (
        <button
            type="button"
            onClick={onClick}
            aria-label={`Ver detalle de ${session.className} ${session.date} ${session.startTime}`}
            className={cn(
                'w-full rounded-md border border-border bg-card p-2 text-left transition-colors hover:border-primary/50 hover:bg-muted/40',
                cancelled && 'opacity-50 hover:border-border',
            )}
        >
            <p className={cn('truncate text-xs font-semibold text-foreground', cancelled && 'line-through')}>
                {session.className}
            </p>
            <p className="truncate text-[11px] text-muted-foreground">{session.trainer}</p>
            {cancelled ? (
                <p className="mt-1 text-[11px] font-medium text-muted-foreground">Cancelada</p>
            ) : (
                <p className={cn('mt-1 text-[11px] font-medium', occupancyTone(session))}>
                    {session.booked}/{session.capacity}
                    {session.waitlistCount > 0 && (
                        <span className="ml-1 inline-flex items-center gap-0.5 text-warning">
                            +{session.waitlistCount} <Clock className="h-3 w-3" aria-hidden />
                        </span>
                    )}
                </p>
            )}
        </button>
    );
}
