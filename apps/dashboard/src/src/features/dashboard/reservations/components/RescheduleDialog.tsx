import { useState } from 'react';
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

import { useRescheduleOptions, useRescheduleReservation } from '../hooks';
import type { Reservation } from '../types';
import { formatTime12h, sessionStartDate } from '../utils';

interface RescheduleDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    reservation: Reservation;
}

/** Mueve una reserva a otra sesión (con cupo) de la misma clase. */
export function RescheduleDialog({ open, onOpenChange, reservation }: RescheduleDialogProps) {
    const [targetId, setTargetId] = useState('');
    const { data: options = [] } = useRescheduleOptions(reservation.id, open);
    const rescheduleReservation = useRescheduleReservation();

    const handleConfirm = () => {
        void rescheduleReservation.mutateAsync({ id: reservation.id, newSessionId: targetId }).then(() => {
            sileo.success({ title: `Reserva de ${reservation.memberName} reprogramada` });
            setTargetId('');
            onOpenChange(false);
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-card border-border sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Reprogramar reserva</DialogTitle>
                    <DialogDescription>
                        Mover la reserva de {reservation.memberName} a otra sesión de la misma clase con cupo
                        disponible.
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
                                    {format(sessionStartDate(s), 'EEE d MMM', { locale: es })} ·{' '}
                                    {formatTime12h(s.startTime)} ({s.booked}/{s.capacity})
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
