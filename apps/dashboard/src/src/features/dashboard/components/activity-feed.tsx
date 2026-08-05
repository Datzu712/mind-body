import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Activity, CalendarCheck, CalendarX, Clock, UserCheck, UserX } from 'lucide-react';
import { useRecentReservations } from '../stats/hooks';
import type { ReservationStatus } from '../stats/types';

const statusMeta: Record<ReservationStatus, { icon: typeof Activity; label: string; color: string }> = {
    CONFIRMED: { icon: CalendarCheck, label: 'reservó', color: 'bg-primary/20 text-primary' },
    WAITLISTED: { icon: Clock, label: 'entró a lista de espera de', color: 'bg-muted text-muted-foreground' },
    ATTENDED: { icon: UserCheck, label: 'asistió a', color: 'bg-success/20 text-success' },
    NO_SHOW: { icon: UserX, label: 'no se presentó a', color: 'bg-destructive/20 text-destructive' },
    CANCELLED: { icon: CalendarX, label: 'canceló', color: 'bg-muted text-muted-foreground' },
};

/** Relative time in Spanish, coarse on purpose — the feed only needs "how recent". */
function relativeTime(iso: string): string {
    const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60_000);

    if (minutes < 1) return 'Recién';
    if (minutes < 60) return `Hace ${minutes} min`;

    const hours = Math.round(minutes / 60);
    if (hours < 24) return `Hace ${hours} h`;

    const days = Math.round(hours / 24);
    return days === 1 ? 'Ayer' : `Hace ${days} días`;
}

export function ActivityFeed() {
    const { data, isLoading, isError } = useRecentReservations(8);
    const reservations = data ?? [];

    return (
        <Card className="border-border bg-card h-full">
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                    <Activity className="h-5 w-5 text-primary" />
                    Reservas recientes
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <ScrollArea className="h-[400px] px-6 pb-6">
                    {isLoading && (
                        <div className="flex flex-col gap-4">
                            {Array.from({ length: 5 }).map((_, index) => (
                                <div key={index} className="h-16 animate-pulse rounded-lg bg-muted/40" />
                            ))}
                        </div>
                    )}

                    {!isLoading && isError && (
                        <p className="py-10 text-center text-sm text-muted-foreground">
                            No se pudo cargar la actividad.
                        </p>
                    )}

                    {!isLoading && !isError && reservations.length === 0 && (
                        <p className="py-10 text-center text-sm text-muted-foreground">Todavía no hay reservas.</p>
                    )}

                    <div className="flex flex-col gap-4">
                        {reservations.map((reservation) => {
                            const meta = statusMeta[reservation.status];
                            const Icon = meta.icon;

                            return (
                                <div
                                    key={reservation.id}
                                    className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
                                >
                                    <div
                                        className={cn(
                                            'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
                                            meta.color,
                                        )}
                                    >
                                        <Icon className="h-4 w-4" />
                                    </div>
                                    <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                                        <p className="text-sm font-medium text-foreground truncate">
                                            {reservation.memberName} {meta.label} {reservation.className}
                                        </p>
                                        <span className="text-xs text-muted-foreground">
                                            {relativeTime(reservation.createdAt)}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    );
}
