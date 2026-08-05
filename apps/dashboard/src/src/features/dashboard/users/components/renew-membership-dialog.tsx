import { useEffect, useId, useState } from 'react';
import { addDays, format } from 'date-fns';
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
import { formatDate } from '@/lib/utils';
import { sileo } from 'sileo';
import type { Membership } from '../types';
import { useCreateMembership } from '../hooks';

const DURATIONS = [
    { value: '30', label: '1 mes (30 dias)' },
    { value: '90', label: '3 meses (90 dias)' },
    { value: '180', label: '6 meses (180 dias)' },
    { value: '365', label: '1 año (365 dias)' },
];

/** Local 'YYYY-MM-DD'; parsing an ISO date needs the time part or it shifts to UTC. */
const toIso = (date: Date) => format(date, 'yyyy-MM-dd');
const fromIso = (iso: string) => new Date(`${iso}T00:00:00`);

/**
 * A term covers [startDate, endDate] INCLUSIVE — that is how the backend checks
 * coverage — so 30 days means `start + 29`, and the next term can start the very
 * next day without overlapping.
 */
const endOfTerm = (startIso: string, days: number) => toIso(addDays(fromIso(startIso), days - 1));

/**
 * A renewal starts the day after the running term ends, so paying early does not
 * throw away the days already covered. With no running term it starts today.
 */
function defaultStart(runningEndDate: string | undefined): string {
    const today = toIso(new Date());
    if (runningEndDate && runningEndDate >= today) {
        return toIso(addDays(fromIso(runningEndDate), 1));
    }
    return today;
}

interface RenewMembershipDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    /** `members.id` (`user.memberProfile.id`). */
    memberId: string;
    /** Current term, used only to chain the start date. */
    current?: Membership | undefined;
}

/**
 * Renewal = a new membership term. There is no payment step: the money is taken
 * at the front desk and the system only records the dates.
 */
export function RenewMembershipDialog({ open, onOpenChange, memberId, current }: RenewMembershipDialogProps) {
    const uid = useId();
    // Primitive, not the object: `current` gets a new identity on every refetch,
    // and re-seeding the form under the user while the dialog is open would wipe
    // whatever start date they picked.
    const runningEndDate = current?.status === 'ACTIVE' ? current.endDate : undefined;

    const [duration, setDuration] = useState('30');
    const [startDate, setStartDate] = useState(() => defaultStart(runningEndDate));
    const createMembership = useCreateMembership(memberId);

    // Re-seed on open so a term renewed in this same session chains correctly.
    useEffect(() => {
        if (open) {
            setDuration('30');
            setStartDate(defaultStart(runningEndDate));
        }
    }, [open, runningEndDate]);

    const endDate = startDate ? endOfTerm(startDate, Number(duration)) : '';

    const handleRenew = (e: React.FormEvent) => {
        e.preventDefault();
        if (!endDate) return;

        void createMembership
            .mutateAsync({ startDate, endDate })
            .then(() => {
                sileo.success({ title: `Membresia vigente hasta el ${formatDate(endDate)}` });
                onOpenChange(false);
            })
            .catch((error: unknown) => {
                sileo.error({
                    title: 'Error al renovar la membresia',
                    description: error instanceof Error ? error.message : undefined,
                });
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
                        <Label htmlFor={`${uid}-start`} className="text-sm font-medium">
                            Inicio
                        </Label>
                        <Input
                            id={`${uid}-start`}
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="bg-secondary/50 border-border"
                        />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor={`${uid}-duration`} className="text-sm font-medium">
                            Duracion
                        </Label>
                        <Select value={duration} onValueChange={setDuration}>
                            <SelectTrigger id={`${uid}-duration`} className="bg-secondary/50 border-border">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-popover border-border">
                                {DURATIONS.map((d) => (
                                    <SelectItem key={d.value} value={d.value}>
                                        {d.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    {endDate && (
                        <p className="text-sm text-muted-foreground">
                            Vence el <span className="font-medium text-foreground">{formatDate(endDate)}</span>.
                            {current?.status === 'ACTIVE' && ' La membresia actual pasa a vencida.'}
                        </p>
                    )}
                    <DialogFooter className="gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={createMembership.isPending}
                        >
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={createMembership.isPending || !startDate}>
                            Confirmar renovacion
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
