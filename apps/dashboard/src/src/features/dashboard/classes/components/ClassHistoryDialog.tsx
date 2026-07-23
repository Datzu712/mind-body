import { useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationNext,
    PaginationPrevious,
} from '@/components/ui/pagination';
import { cn } from '@/lib/utils';
import { CalendarCheck, CalendarClock, CheckCircle2, MoveRight, XCircle, type LucideIcon } from 'lucide-react';
import {
    classSessionStatusLabels,
    generateClassSessions,
    type ClassSession,
    type ClassSessionStatus,
    type ManagedClass,
} from '../mock-classes';

const PAGE_SIZE = 20;
type StatusFilter = 'all' | ClassSessionStatus;

const sessionConfig: Record<ClassSessionStatus, { label: string; icon: LucideIcon; className: string }> = {
    realizada: {
        label: classSessionStatusLabels.realizada,
        icon: CheckCircle2,
        className: 'bg-success/20 text-success hover:bg-success/30 border-success/30',
    },
    cancelada: {
        label: classSessionStatusLabels.cancelada,
        icon: XCircle,
        className: 'bg-muted text-muted-foreground hover:bg-muted/80 border-muted-foreground/30',
    },
    reprogramada: {
        label: classSessionStatusLabels.reprogramada,
        icon: CalendarClock,
        className: 'bg-primary/20 text-primary hover:bg-primary/30 border-primary/30',
    },
    movida: {
        label: classSessionStatusLabels.movida,
        icon: MoveRight,
        className: 'bg-warning/20 text-warning hover:bg-warning/30 border-warning/30',
    },
};

interface ClassSessionStatusBadgeProps {
    status: ClassSessionStatus;
    className?: string;
}

export function ClassSessionStatusBadge({ status, className }: ClassSessionStatusBadgeProps) {
    const { label, icon: Icon, className: cls } = sessionConfig[status];
    return (
        <Badge variant="outline" className={cn('gap-1 border font-medium', cls, className)}>
            <Icon className="h-3.5 w-3.5" aria-hidden />
            {label}
        </Badge>
    );
}

interface ClassHistoryDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    item: ManagedClass | null;
}

function formatSessionDate(iso: string, time: string): string {
    const [y, m, d] = iso.split('-').map((n) => parseInt(n, 10));
    const date = new Date(y, (m ?? 1) - 1, d ?? 1);
    const dateLabel = date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
    return `${dateLabel} · ${time}`;
}

export function ClassHistoryDialog({ open, onOpenChange, item }: ClassHistoryDialogProps) {
    const [desde, setDesde] = useState('');
    const [hasta, setHasta] = useState('');
    const [status, setStatus] = useState<StatusFilter>('all');
    const [page, setPage] = useState(1);

    const rangeError = !!desde && !!hasta && desde > hasta;

    const allSessions = useMemo(() => (item ? generateClassSessions([item]) : []), [item]);

    const filtered = useMemo<ClassSession[]>(() => {
        if (!item) return [];
        const base = allSessions.filter((s) => s.classId === item.id);
        const sorted = [...base].sort((a, b) => {
            if (a.date !== b.date) return a.date < b.date ? 1 : -1;
            if (a.time !== b.time) return a.time < b.time ? 1 : -1;
            return a.id < b.id ? 1 : -1;
        });
        if (rangeError) return sorted;
        return sorted.filter((s) => {
            if (status !== 'all' && s.status !== status) return false;
            if (desde && s.date < desde) return false;
            if (hasta && s.date > hasta) return false;
            return true;
        });
    }, [allSessions, item, status, desde, hasta, rangeError]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const safePage = Math.min(page, totalPages);
    const pageItems = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

    const resetPageAndApply = (next: { desde?: string; hasta?: string; status?: StatusFilter }) => {
        if (next.desde !== undefined) setDesde(next.desde);
        if (next.hasta !== undefined) setHasta(next.hasta);
        if (next.status !== undefined) setStatus(next.status);
        setPage(1);
    };

    const handleClear = () => resetPageAndApply({ desde: '', hasta: '', status: 'all' });

    if (!item) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-card border-border sm:max-w-4xl">
                <DialogHeader>
                    <DialogTitle className="text-foreground">Historial — {item.name}</DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                        Sesiones pasadas de la serie, con entrenador, cupo, reservas y asistencia.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
                    <div className="flex flex-col gap-1">
                        <label htmlFor="history-desde" className="text-xs text-muted-foreground">
                            Desde
                        </label>
                        <Input
                            id="history-desde"
                            type="date"
                            value={desde}
                            onChange={(e) => resetPageAndApply({ desde: e.target.value })}
                            className="bg-secondary/50 border-border sm:w-44"
                        />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label htmlFor="history-hasta" className="text-xs text-muted-foreground">
                            Hasta
                        </label>
                        <Input
                            id="history-hasta"
                            type="date"
                            value={hasta}
                            onChange={(e) => resetPageAndApply({ hasta: e.target.value })}
                            className="bg-secondary/50 border-border sm:w-44"
                        />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label htmlFor="history-status" className="text-xs text-muted-foreground">
                            Estado
                        </label>
                        <Select
                            value={status}
                            onValueChange={(value) => resetPageAndApply({ status: value as StatusFilter })}
                        >
                            <SelectTrigger id="history-status" className="bg-secondary/50 border-border sm:w-48">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-popover border-border">
                                <SelectItem value="all">Todos los estados</SelectItem>
                                <SelectItem value="realizada">{classSessionStatusLabels.realizada}</SelectItem>
                                <SelectItem value="cancelada">{classSessionStatusLabels.cancelada}</SelectItem>
                                <SelectItem value="reprogramada">{classSessionStatusLabels.reprogramada}</SelectItem>
                                <SelectItem value="movida">{classSessionStatusLabels.movida}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <Button type="button" variant="ghost" onClick={handleClear} className="sm:ml-auto">
                        <CalendarCheck className="mr-2 h-4 w-4" />
                        Limpiar filtros
                    </Button>
                </div>

                {rangeError && (
                    <p className="text-sm text-destructive" role="alert">
                        La fecha «desde» no puede ser posterior a «hasta».
                    </p>
                )}

                <div className="overflow-x-auto rounded-lg border border-border">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/30 hover:bg-muted/30">
                                <TableHead className="text-muted-foreground font-semibold">Fecha/hora</TableHead>
                                <TableHead className="text-muted-foreground font-semibold">Estado</TableHead>
                                <TableHead className="text-muted-foreground font-semibold">Entrenador</TableHead>
                                <TableHead className="text-muted-foreground font-semibold">Cupo</TableHead>
                                <TableHead className="text-muted-foreground font-semibold">Reservas</TableHead>
                                <TableHead className="text-muted-foreground font-semibold">
                                    Asistencias / no-shows
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {pageItems.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                        {allSessions.some((s) => s.classId === item.id)
                                            ? 'No se encontraron sesiones con los filtros aplicados.'
                                            : 'Sin sesiones en el historial'}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                pageItems.map((s) => (
                                    <TableRow key={s.id} className="border-border">
                                        <TableCell className="whitespace-nowrap text-foreground">
                                            {formatSessionDate(s.date, s.time)}
                                        </TableCell>
                                        <TableCell>
                                            <ClassSessionStatusBadge status={s.status} />
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">{s.trainer}</TableCell>
                                        <TableCell className="whitespace-nowrap text-foreground">
                                            {s.capacity}
                                        </TableCell>
                                        <TableCell className="whitespace-nowrap text-foreground">
                                            {s.reservations}
                                        </TableCell>
                                        <TableCell className="whitespace-nowrap text-foreground">
                                            {s.attended} / {s.noShow}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                <div className="flex flex-col items-center gap-2">
                    <p className="text-sm text-muted-foreground">
                        Página {safePage} de {totalPages}
                    </p>
                    <Pagination>
                        <PaginationContent>
                            <PaginationItem>
                                <PaginationPrevious
                                    text="Anterior"
                                    aria-label="Página anterior"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        if (safePage > 1) setPage(safePage - 1);
                                    }}
                                    className={cn(safePage <= 1 && 'pointer-events-none opacity-50')}
                                />
                            </PaginationItem>
                            <PaginationItem>
                                <PaginationNext
                                    text="Siguiente"
                                    aria-label="Página siguiente"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        if (safePage < totalPages) setPage(safePage + 1);
                                    }}
                                    className={cn(safePage >= totalPages && 'pointer-events-none opacity-50')}
                                />
                            </PaginationItem>
                        </PaginationContent>
                    </Pagination>
                </div>
            </DialogContent>
        </Dialog>
    );
}
