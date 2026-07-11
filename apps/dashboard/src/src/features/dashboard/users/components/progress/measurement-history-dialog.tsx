import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useMemberMeasurements } from '../../hooks';
import { MeasurementHistoryTable } from './measurement-history';

/**
 * "Mostrar más" trigger that opens the member's full measurement history in a modal.
 * The full (all-time) history is only fetched once the dialog is opened.
 */
export function MeasurementHistoryDialog({ userId, totalRecords }: { userId: string; totalRecords: number }) {
    const [open, setOpen] = useState(false);
    const history = useMemberMeasurements(userId, undefined, undefined, { enabled: open });
    const rows = history.data ?? [];

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger className="text-sm font-medium text-primary underline-offset-4 hover:underline">
                Mostrar más...
            </DialogTrigger>
            <DialogContent className="sm:max-w-4xl">
                <DialogHeader>
                    <DialogTitle>Historial de mediciones</DialogTitle>
                    <DialogDescription>{totalRecords} mediciones registradas en total.</DialogDescription>
                </DialogHeader>
                {history.isLoading ? <Skeleton className="h-[55vh] w-full" /> : <MeasurementHistoryTable rows={rows} />}
            </DialogContent>
        </Dialog>
    );
}
