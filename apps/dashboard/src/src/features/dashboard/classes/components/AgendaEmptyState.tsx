import { Card, CardContent } from '@/components/ui/card';
import { CalendarX2 } from 'lucide-react';

interface AgendaEmptyStateProps {
    title?: string;
    description?: string;
}

/** Empty state shown when the selected day has no scheduled sessions. */
export function AgendaEmptyState({
    title = 'No hay sesiones programadas',
    description = 'No hay reservas ni sesiones para la fecha seleccionada.',
}: AgendaEmptyStateProps) {
    return (
        <Card className="border-dashed border-border bg-card">
            <CardContent className="flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                    <CalendarX2 className="h-7 w-7 text-muted-foreground" aria-hidden />
                </div>
                <div className="flex flex-col gap-1">
                    <p className="text-base font-semibold text-foreground">{title}</p>
                    <p className="text-sm text-muted-foreground">{description}</p>
                </div>
            </CardContent>
        </Card>
    );
}
