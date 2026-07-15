import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { CalendarClock, MoreHorizontal, UserCheck, UserX, XCircle } from 'lucide-react';
import { sileo } from 'sileo';

import { ConfirmDialog } from '@/src/shared/components/confirm-dialog';
import { isPastSession, type Reservation } from '../mock-reservations';
import type { ReservationsStore } from '../use-reservations-mock';
import { RescheduleDialog } from './RescheduleDialog';

interface ReservationActionsProps {
    store: ReservationsStore;
    reservation: Reservation;
}

/**
 * Menú ⋯ de una reserva. Sesión futura: reprogramar / cancelar (reservas
 * vigentes). Sesión pasada: marcar asistencia (permite corregir). Todas las
 * acciones son ítems de menú con el nombre del miembro en el feedback, para
 * evitar cambios accidentales sobre la fila equivocada.
 */
export function ReservationActions({ store, reservation }: ReservationActionsProps) {
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [rescheduleOpen, setRescheduleOpen] = useState(false);

    const session = store.sessionById.get(reservation.sessionId);
    const past = session ? isPastSession(session) : false;

    if (reservation.status === 'cancelada') return null;
    if (past && reservation.status === 'en-espera') return null;
    if (!past && reservation.status !== 'confirmada' && reservation.status !== 'en-espera') return null;

    const late = store.isLateCancellation(reservation.id);

    const markAttendance = (attended: boolean) => {
        store.markAttendance(reservation.id, attended);
        sileo.success({
            title: `${reservation.memberName} marcado como "${attended ? 'Asistió' : 'Faltó'}"`,
        });
    };

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        aria-label={`Acciones para la reserva de ${reservation.memberName}`}
                    >
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-auto min-w-44 whitespace-nowrap bg-popover border-border">
                    {past ? (
                        <>
                            <DropdownMenuItem
                                className="cursor-pointer"
                                disabled={reservation.status === 'asistio'}
                                onClick={() => markAttendance(true)}
                            >
                                <UserCheck className="mr-2 h-4 w-4" />
                                Marcar asistió
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                className="cursor-pointer"
                                disabled={reservation.status === 'falto'}
                                onClick={() => markAttendance(false)}
                            >
                                <UserX className="mr-2 h-4 w-4" />
                                Marcar faltó
                            </DropdownMenuItem>
                        </>
                    ) : (
                        <>
                            <DropdownMenuItem className="cursor-pointer" onClick={() => setRescheduleOpen(true)}>
                                <CalendarClock className="mr-2 h-4 w-4" />
                                Reprogramar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-border" />
                            <DropdownMenuItem
                                className="cursor-pointer text-destructive focus:text-destructive"
                                onClick={() => setConfirmOpen(true)}
                            >
                                <XCircle className="mr-2 h-4 w-4" />
                                Cancelar reserva
                            </DropdownMenuItem>
                        </>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>

            <ConfirmDialog
                open={confirmOpen}
                onOpenChange={setConfirmOpen}
                title="Cancelar reserva"
                description={
                    late
                        ? `La sesión de ${reservation.memberName} inicia en menos de 12 horas: la cancelación tardía se registrará como "Faltó".`
                        : `¿Cancelar la reserva de ${reservation.memberName}? El cupo quedará disponible.`
                }
                confirmLabel="Cancelar reserva"
                variant="destructive"
                onConfirm={() => {
                    store.cancelReservation(reservation.id);
                    sileo.warning({
                        title: late
                            ? `Cancelación tardía: ${reservation.memberName} quedó como "Faltó"`
                            : `Reserva de ${reservation.memberName} cancelada`,
                    });
                    setConfirmOpen(false);
                }}
            />

            <RescheduleDialog
                open={rescheduleOpen}
                onOpenChange={setRescheduleOpen}
                store={store}
                reservation={reservation}
            />
        </>
    );
}
