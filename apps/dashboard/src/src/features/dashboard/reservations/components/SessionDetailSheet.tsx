import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import {
    ArrowUpCircle,
    CalendarClock,
    CircleSlash,
    MoreHorizontal,
    Search,
    Trash2,
    Users,
    XCircle,
} from 'lucide-react';
import { sileo } from 'sileo';

import { ConfirmDialog } from '@/src/shared/components/confirm-dialog';
import {
    useCancelSession,
    usePromoteFromWaitlist,
    useRemoveFromWaitlist,
    useSession,
    useSessionReservations,
    useSessionWaitlist,
} from '../hooks';
import type { WaitlistEntry } from '../types';
import { formatTime12h, isPastSession, sessionStartDate } from '../utils';
import { ClassStatusBadge } from './ClassStatusBadge';
import { MoveSessionDialog } from './MoveSessionDialog';
import { ReservationActions } from './ReservationActions';

interface SessionDetailSheetProps {
    sessionId: string | null;
    onOpenChange: (open: boolean) => void;
}

/** Menú ⋯ de una entrada de lista de espera: promover o quitar (con confirmación). */
function WaitlistEntryActions({ entry, hasRoom }: { entry: WaitlistEntry; hasRoom: boolean }) {
    const [confirmOpen, setConfirmOpen] = useState(false);
    const promote = usePromoteFromWaitlist();
    const remove = useRemoveFromWaitlist();

    const handlePromote = () => {
        void promote
            .mutateAsync(entry.reservationId)
            .then(() => sileo.success({ title: `${entry.memberName} promovido a la sesión` }))
            .catch((error: unknown) =>
                sileo.warning({ title: error instanceof Error ? error.message : 'No se pudo promover' }),
            );
    };

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        aria-label={`Acciones para ${entry.memberName} en lista de espera`}
                    >
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-auto min-w-44 whitespace-nowrap bg-popover border-border">
                    <DropdownMenuItem className="cursor-pointer" disabled={!hasRoom} onClick={handlePromote}>
                        <ArrowUpCircle className="mr-2 h-4 w-4" />
                        {hasRoom ? 'Promover a la sesión' : 'Promover (sin cupo)'}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-border" />
                    <DropdownMenuItem
                        className="cursor-pointer text-destructive focus:text-destructive"
                        onClick={() => setConfirmOpen(true)}
                    >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Quitar de la lista
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <ConfirmDialog
                open={confirmOpen}
                onOpenChange={setConfirmOpen}
                title="Quitar de la lista de espera"
                description={`¿Quitar a ${entry.memberName} de la lista de espera? Perderá su posición (${entry.position}º).`}
                confirmLabel="Quitar"
                variant="destructive"
                onConfirm={() => {
                    void remove
                        .mutateAsync(entry.reservationId)
                        .then(() => sileo.warning({ title: `${entry.memberName} quitado de la lista de espera` }));
                    setConfirmOpen(false);
                }}
            />
        </>
    );
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
    const { data: allWaitlist = [] } = useSessionWaitlist(sessionId);
    const cancelSession = useCancelSession();

    const hasRoom = session ? session.booked < session.capacity : false;
    const past = session ? isPastSession(session) : false;
    const cancelled = session?.status === 'cancelada';

    const normalizedQuery = query.trim().toLowerCase();
    const matches = (name: string) => name.toLowerCase().includes(normalizedQuery);
    const reservations = allReservations.filter((r) => matches(r.memberName));
    const waitlist = allWaitlist.filter((entry) => matches(entry.memberName));

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
                                {session.trainer}
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
                                    {session.waitlistCount > 0 && (
                                        <span className="ml-2 text-xs font-medium text-warning">
                                            +{session.waitlistCount} en espera
                                        </span>
                                    )}
                                </span>
                            </div>

                            {/* Búsqueda */}
                            {(allReservations.length > 0 || allWaitlist.length > 0) && (
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

                            {/* Listas con scroll propio; encabezado, ocupación y búsqueda quedan fijos */}
                            <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto">
                                {/* Reservas */}
                                <div className="flex flex-col gap-2">
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

                                {/* Lista de espera */}
                                {allWaitlist.length > 0 && (
                                    <>
                                        <Separator className="bg-border" />
                                        <div className="flex flex-col gap-2">
                                            <h3 className="text-sm font-semibold text-foreground">
                                                Lista de espera ({waitlist.length}
                                                {normalizedQuery ? ` de ${allWaitlist.length}` : ''})
                                            </h3>
                                            {waitlist.length === 0 ? (
                                                <p className="text-sm text-muted-foreground">
                                                    Ningún miembro coincide con la búsqueda.
                                                </p>
                                            ) : (
                                                waitlist.map((entry) => (
                                                    <div
                                                        key={entry.reservationId}
                                                        className="flex items-center justify-between gap-2 rounded-md border border-border p-2 transition-colors hover:bg-muted/40"
                                                    >
                                                        <span className="flex items-center gap-2 truncate">
                                                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-warning/20 text-[11px] font-semibold text-warning">
                                                                {entry.position}
                                                            </span>
                                                            <span className="truncate text-sm font-medium text-foreground">
                                                                {entry.memberName}
                                                            </span>
                                                        </span>
                                                        <WaitlistEntryActions entry={entry} hasRoom={hasRoom} />
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        <MoveSessionDialog open={moveOpen} onOpenChange={setMoveOpen} session={session} />

                        <ConfirmDialog
                            open={cancelOpen}
                            onOpenChange={setCancelOpen}
                            title="Cancelar sesión"
                            description={`Se cancelará esta sesión de ${session.className} y sus ${session.booked + session.waitlistCount} reservas activas. Los miembros serán notificados.`}
                            confirmLabel="Cancelar sesión"
                            variant="destructive"
                            onConfirm={() => {
                                void cancelSession.mutateAsync(session.id).then((result) => {
                                    sileo.warning({
                                        title: `Sesión cancelada — ${result.affectedReservations} reservas canceladas`,
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
