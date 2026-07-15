import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { sileo } from 'sileo';

import { isPastSession, sessionStartDate, type Reservation } from '../mock-reservations';
import type { ReservationsStore } from '../use-reservations-mock';

interface RescheduleDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    store: ReservationsStore;
    reservation: Reservation;
}

/** Mueve una reserva a otra sesión (con cupo) de la misma clase. */
export function RescheduleDialog({ open, onOpenChange, store, reservation }: RescheduleDialogProps) {
    const [targetId, setTargetId] = useState('');

    const currentSession = store.sessionById.get(reservation.sessionId);
    const options = useMemo(() => {
        if (!currentSession) return [];
        return [0, 1, 2]
            .flatMap((offset) => store.getSessionsForWeek(offset))
            .filter(
                (s) =>
                    s.classId === currentSession.classId &&
                    s.id !== currentSession.id &&
                    s.booked < s.capacity &&
                    !isPastSession(s),
            );
    }, [currentSession, store]);

    const handleConfirm = () => {
        store.rescheduleReservation(reservation.id, targetId);
        sileo.success({ title: `Reserva de ${reservation.memberName} reprogramada` });
        setTargetId('');
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-card border-border sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Reprogramar reserva</DialogTitle>
                    <DialogDescription>
                        Mover la reserva de {reservation.memberName} ({currentSession?.className ?? ''}) a otra sesión
                        con cupo disponible.
                    </DialogDescription>
                </DialogHeader>

                {options.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                        No hay sesiones alternativas con cupo disponible para esta clase.
                    </p>
                ) : (
                    <Select value={targetId} onValueChange={setTargetId}>
                        <SelectTrigger className="bg-secondary/50 border-border">
                            <SelectValue placeholder="Seleccionar nueva sesión" />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border-border">
                            {options.map((s) => (
                                <SelectItem key={s.id} value={s.id} className="capitalize">
                                    {format(sessionStartDate(s), 'EEE d MMM', { locale: es })} · {s.startTime} (
                                    {s.booked}/{s.capacity})
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                )}

                <DialogFooter>
                    <Button variant="outline" className="border-border" onClick={() => onOpenChange(false)}>
                        Cancelar
                    </Button>
                    <Button disabled={!targetId} onClick={handleConfirm}>
                        Reprogramar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
