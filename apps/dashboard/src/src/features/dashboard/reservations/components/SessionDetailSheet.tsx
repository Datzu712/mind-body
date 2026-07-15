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
import { ArrowUpCircle, MoreHorizontal, Search, Trash2, Users } from 'lucide-react';
import { sileo } from 'sileo';

import { ConfirmDialog } from '@/src/shared/components/confirm-dialog';
import { sessionStartDate, type WaitlistEntry } from '../mock-reservations';
import type { ReservationsStore } from '../use-reservations-mock';
import { ClassStatusBadge } from './ClassStatusBadge';
import { ReservationActions } from './ReservationActions';

interface SessionDetailSheetProps {
    store: ReservationsStore;
    sessionId: string | null;
    onOpenChange: (open: boolean) => void;
}

/** Menú ⋯ de una entrada de lista de espera: promover o quitar (con confirmación). */
function WaitlistEntryActions({
    store,
    entry,
    hasRoom,
}: {
    store: ReservationsStore;
    entry: WaitlistEntry;
    hasRoom: boolean;
}) {
    const [confirmOpen, setConfirmOpen] = useState(false);

    const handlePromote = () => {
        const result = store.promoteFromWaitlist(entry.reservationId);
        if (result.ok) {
            sileo.success({ title: `${entry.memberName} promovido a la sesión` });
        } else {
            sileo.warning({ title: result.error ?? 'No se pudo promover' });
        }
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
                    store.removeFromWaitlist(entry.reservationId);
                    sileo.warning({ title: `${entry.memberName} quitado de la lista de espera` });
                    setConfirmOpen(false);
                }}
            />
        </>
    );
}

export function SessionDetailSheet({ store, sessionId, onOpenChange }: SessionDetailSheetProps) {
    const [query, setQuery] = useState('');

    // Al abrir otra sesión, la búsqueda anterior no debe arrastrarse.
    useEffect(() => {
        setQuery('');
    }, [sessionId]);

    const session = sessionId ? store.getOccupancy(sessionId) : undefined;
    const hasRoom = session ? session.booked < session.capacity : false;

    const normalizedQuery = query.trim().toLowerCase();
    const matches = (name: string) => name.toLowerCase().includes(normalizedQuery);

    const allReservations = sessionId ? store.getSessionReservations(sessionId) : [];
    const allWaitlist = sessionId ? store.getWaitlist(sessionId) : [];
    const reservations = allReservations.filter((r) => matches(r.memberName));
    const waitlist = allWaitlist.filter((entry) => matches(entry.memberName));

    return (
        <Sheet open={!!session} onOpenChange={onOpenChange}>
            <SheetContent className="w-full sm:max-w-md">
                {session && (
                    <>
                        <SheetHeader>
                            <SheetTitle>{session.className}</SheetTitle>
                            <SheetDescription className="capitalize">
                                {format(sessionStartDate(session), "EEEE d 'de' MMMM", { locale: es })} ·{' '}
                                {session.startTime} – {session.endTime} · {session.trainer}
                            </SheetDescription>
                        </SheetHeader>

                        <div className="flex min-h-0 flex-1 flex-col gap-4 px-4 pb-4">
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
                                                    <ReservationActions store={store} reservation={reservation} />
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
                                                        <WaitlistEntryActions
                                                            store={store}
                                                            entry={entry}
                                                            hasRoom={hasRoom}
                                                        />
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </SheetContent>
        </Sheet>
    );
}
