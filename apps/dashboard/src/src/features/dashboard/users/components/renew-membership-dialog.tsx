import { useId, useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { sileo } from 'sileo';

interface RenewMembershipDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

/**
 * Confirmation dialog for renewing a member's membership. The renewal itself is
 * still mocked (1s delay) pending the payments backend.
 */
export function RenewMembershipDialog({ open, onOpenChange }: RenewMembershipDialogProps) {
    const uid = useId();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [duration, setDuration] = useState('30');

    const handleRenew = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        const renewPromise = new Promise<void>((resolve) => setTimeout(resolve, 1000));
        sileo
            .promise(renewPromise, {
                loading: { title: 'Procesando renovacion...' },
                success: { title: `Membresia extendida ${duration} dias` },
                error: { title: 'Error al renovar la membresia' },
            })
            .catch(console.error);
        void renewPromise.then(() => {
            onOpenChange(false);
            setIsSubmitting(false);
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-card border-border sm:max-w-[420px]">
                <DialogHeader>
                    <DialogTitle className="text-foreground">Renovar membresia</DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                        Extiende la membresia del miembro tras confirmar el pago en recepcion.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleRenew} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor={`${uid}-duration`} className="text-sm font-medium">
                            Duracion
                        </Label>
                        <Select value={duration} onValueChange={setDuration}>
                            <SelectTrigger id={`${uid}-duration`} className="bg-secondary/50 border-border">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-popover border-border">
                                <SelectItem value="30">1 mes (30 dias)</SelectItem>
                                <SelectItem value="90">3 meses (90 dias)</SelectItem>
                                <SelectItem value="180">6 meses (180 dias)</SelectItem>
                                <SelectItem value="365">1 año (365 dias)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor={`${uid}-payment`} className="text-sm font-medium">
                            Metodo de pago
                        </Label>
                        <Input
                            id={`${uid}-payment`}
                            placeholder="Ej: Efectivo, Tarjeta, Transferencia..."
                            className="bg-secondary/50 border-border"
                        />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor={`${uid}-notes`} className="text-sm font-medium">
                            Notas (opcional)
                        </Label>
                        <Input
                            id={`${uid}-notes`}
                            placeholder="Observaciones del pago..."
                            className="bg-secondary/50 border-border"
                        />
                    </div>
                    <DialogFooter className="gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isSubmitting}
                        >
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            Confirmar renovacion
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
