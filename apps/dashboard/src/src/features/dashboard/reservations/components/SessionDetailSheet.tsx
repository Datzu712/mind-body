import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { CalendarClock, CircleSlash, Search, Users, XCircle } from 'lucide-react';
import { sileo } from 'sileo';

import { ConfirmDialog } from '@/src/shared/components/confirm-dialog';
import { useCancelSession, useSession, useSessionReservations } from '../hooks';
import { formatTime12h, isPastSession, sessionStartDate } from '../utils';
import { ClassStatusBadge } from './ClassStatusBadge';
import { MoveSessionDialog } from './MoveSessionDialog';
import { ReservationActions } from './ReservationActions';

interface SessionDetailSheetProps {
    sessionId: string | null;
    onOpenChange: (open: boolean) => void;
}

export function SessionDetailSheet({ sessionId, onOpenChange }: SessionDetailSheetProps) {
    const [query, setQuery] = useState('');
    const [moveOpen, setMoveOpen] = useState(false);
    const [cancelOpen, setCancelOpen] = useState(false);

    // Al abrir otra sesión, la búsqueda anterior no debe arrastrarse.
    useEffect(() => {
        setQuery('');
    }, [sessionId]);

    const { data: session } = useSession(sessionId);
    const { data: allReservations = [] } = useSessionReservations(sessionId);
    const cancelSession = useCancelSession();

    const past = session ? isPastSession(session) : false;
    const cancelled = session?.status === 'cancelada';

    const normalizedQuery = query.trim().toLowerCase();
    const reservations = allReservations.filter((r) => r.memberName.toLowerCase().includes(normalizedQuery));

    return (
        <Sheet open={!!sessionId} onOpenChange={onOpenChange}>
            <SheetContent className="w-full sm:max-w-md">
                {session && (
                    <>
                        <SheetHeader>
                            <SheetTitle>{session.className}</SheetTitle>
                            <SheetDescription className="capitalize">
                                {format(sessionStartDate(session), "EEEE d 'de' MMMM", { locale: es })} ·{' '}
                                {formatTime12h(session.startTime)} – {formatTime12h(session.endTime)} ·{' '}
                                {session.trainerName}
                            </SheetDescription>
                        </SheetHeader>

                        <div className="flex min-h-0 flex-1 flex-col gap-4 px-4 pb-4">
                            {/* Gestión de la sesión (solo futuras programadas) */}
                            {cancelled ? (
                                <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
                                    <CircleSlash className="h-4 w-4 shrink-0" aria-hidden />
                                    Sesión cancelada — sus reservas fueron canceladas.
                                </div>
                            ) : (
                                !past && (
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="flex-1 border-border"
                                            onClick={() => setMoveOpen(true)}
                                        >
                                            <CalendarClock className="mr-2 h-4 w-4" />
                                            Mover sesión
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="flex-1 border-border text-destructive hover:text-destructive"
                                            onClick={() => setCancelOpen(true)}
                                        >
                                            <XCircle className="mr-2 h-4 w-4" />
                                            Cancelar sesión
                                        </Button>
                                    </div>
                                )
                            )}

                            {/* Ocupación */}
                            <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/30 p-3">
                                <span className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Users className="h-4 w-4" aria-hidden />
                                    Ocupación
                                </span>
                                <span className="text-sm font-semibold text-foreground">
                                    {session.booked} / {session.capacity}
                                </span>
                            </div>

                            {/* Búsqueda */}
                            {allReservations.length > 0 && (
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        placeholder="Buscar miembro..."
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        className="pl-9 bg-secondary/50 border-border"
                                    />
                                </div>
                            )}

                            {/* Lista con scroll propio; encabezado, ocupación y búsqueda fijos */}
                            <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto">
                                <h3 className="text-sm font-semibold text-foreground">
                                    Reservas ({reservations.length}
                                    {normalizedQuery ? ` de ${allReservations.length}` : ''})
                                </h3>
                                {allReservations.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">
                                        Esta sesión todavía no tiene reservas.
                                    </p>
                                ) : reservations.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">
                                        Ningún miembro coincide con la búsqueda.
                                    </p>
                                ) : (
                                    reservations.map((reservation) => (
                                        <div
                                            key={reservation.id}
                                            className="flex items-center justify-between gap-2 rounded-md border border-border p-2 transition-colors hover:bg-muted/40"
                                        >
                                            <span className="truncate text-sm font-medium text-foreground">
                                                {reservation.memberName}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <ClassStatusBadge status={reservation.status} />
                                                <ReservationActions reservation={reservation} session={session} />
                                            </span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        <MoveSessionDialog open={moveOpen} onOpenChange={setMoveOpen} session={session} />

                        <ConfirmDialog
                            open={cancelOpen}
                            onOpenChange={setCancelOpen}
                            title="Cancelar sesión"
                            description={`Se cancelará esta sesión de ${session.className} y sus ${session.booked} reservas activas. Los miembros serán notificados.`}
                            confirmLabel="Cancelar sesión"
                            variant="destructive"
                            onConfirm={() => {
                                void cancelSession
                                    .mutateAsync({ id: session.id, version: session.version })
                                    .then((result) => {
                                        sileo.warning({
                                            title: `Sesión cancelada — ${result.affectedReservations} reservas canceladas`,
                                        });
                                    })
                                    .catch((error: unknown) => {
                                        sileo.error({
                                            title:
                                                error instanceof Error
                                                    ? error.message
                                                    : 'No se pudo cancelar la sesión',
                                        });
                                    });
                                setCancelOpen(false);
                            }}
                        />
                    </>
                )}
            </SheetContent>
        </Sheet>
    );
}
