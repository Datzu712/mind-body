import { useEffect, useState } from 'react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { sileo } from 'sileo';

import { useMoveSession } from '../hooks';
import type { SessionOccupancy } from '../types';

interface MoveSessionDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    session: SessionOccupancy;
}

/** Mueve UNA sesión puntual a otra fecha/hora; las reservas la siguen. */
export function MoveSessionDialog({ open, onOpenChange, session }: MoveSessionDialogProps) {
    const [date, setDate] = useState(session.date);
    const [time, setTime] = useState(session.startTime);
    const moveSession = useMoveSession();

    useEffect(() => {
        if (open) {
            setDate(session.date);
            setTime(session.startTime);
        }
    }, [open, session.date, session.startTime]);

    const isFuture = new Date(`${date}T${time}:00`).getTime() > Date.now();
    const unchanged = date === session.date && time === session.startTime;

    const handleConfirm = () => {
        void moveSession
            .mutateAsync({ id: session.id, date, startTime: time, version: session.version })
            .then(() => {
                sileo.success({
                    title: `Sesión movida al ${format(new Date(`${date}T00:00:00`), 'EEEE d MMM', { locale: es })}. Los miembros serán notificados.`,
                });
                onOpenChange(false);
            })
            .catch((error: unknown) => {
                sileo.error({ title: error instanceof Error ? error.message : 'No se pudo mover la sesión' });
            });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-card border-border sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Mover sesión</DialogTitle>
                    <DialogDescription>
                        Mover esta sesión de {session.className} a otra fecha u hora. Las {session.booked} reservas se
                        mantienen y los miembros serán notificados.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="flex flex-col gap-2">
                        <Label htmlFor="move-date">Nueva fecha</Label>
                        <Input
                            id="move-date"
                            type="date"
                            min={format(new Date(), 'yyyy-MM-dd')}
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="bg-secondary/50 border-border"
                        />
                    </div>
                    <div className="flex flex-col gap-2">
                        <Label htmlFor="move-time">Nueva hora</Label>
                        <Input
                            id="move-time"
                            type="time"
                            value={time}
                            onChange={(e) => setTime(e.target.value)}
                            className="bg-secondary/50 border-border"
                        />
                    </div>
                </div>
                {!isFuture && (
                    <p className="text-sm text-destructive">La nueva fecha y hora deben estar en el futuro.</p>
                )}

                <DialogFooter>
                    <Button variant="outline" className="border-border" onClick={() => onOpenChange(false)}>
                        Cancelar
                    </Button>
                    <Button disabled={!isFuture || unchanged} onClick={handleConfirm}>
                        Mover sesión
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
