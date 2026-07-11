import { useNavigate } from '@tanstack/react-router';
import { DataTable, type Column } from '@/src/shared/components/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import type { Routine, RoutineStatus } from '../types';

interface RoutinesTableProps {
    routines: Routine[];
    onEdit: (routine: Routine) => void;
    onDelete: (routine: Routine) => void;
}

const statusLabels: Record<RoutineStatus, string> = {
    DRAFT: 'Borrador',
    ACTIVE: 'Activa',
    PAUSED: 'Pausada',
    FINISHED: 'Finalizada',
    ARCHIVED: 'Archivada',
};

const statusColors: Record<RoutineStatus, string> = {
    DRAFT: 'bg-muted text-muted-foreground border-border',
    ACTIVE: 'bg-success/20 text-success border-success/30',
    PAUSED: 'bg-warning/20 text-warning border-warning/30',
    FINISHED: 'bg-info/20 text-info border-info/30',
    ARCHIVED: 'bg-secondary text-muted-foreground border-border',
};

export function RoutinesTable({ routines, onEdit, onDelete }: RoutinesTableProps) {
    const navigate = useNavigate();

    const columns: Column<Routine>[] = [
        {
            key: 'name',
            header: 'Nombre',
            render: (r) => <span className="font-medium text-foreground">{r.name}</span>,
        },
        {
            key: 'objective',
            header: 'Objetivo',
            render: (r) => <span className="text-muted-foreground">{r.objective || '—'}</span>,
        },
        {
            key: 'exercises',
            header: 'Ejercicios',
            render: (r) => r.exercises.length,
            className: 'w-28 text-center',
        },
        {
            key: 'status',
            header: 'Estado',
            render: (r) => (
                <Badge variant="outline" className={statusColors[r.status]}>
                    {statusLabels[r.status]}
                </Badge>
            ),
        },
        {
            key: 'actions',
            header: '',
            className: 'w-16',
            render: (r) => (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-popover border-border">
                        <DropdownMenuItem onClick={() => onEdit(r)} className="cursor-pointer">
                            <Pencil className="mr-2 h-4 w-4" />
                            Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() => onDelete(r)}
                            className="cursor-pointer text-destructive focus:text-destructive"
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Eliminar
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            ),
        },
    ];

    return (
        <DataTable
            columns={columns}
            data={routines}
            keyExtractor={(r) => r.id}
            onRowClick={(r) => void navigate({ to: '/dashboard/routines/$id', params: { id: r.id } })}
            emptyMessage="No hay rutinas registradas"
        />
    );
}
