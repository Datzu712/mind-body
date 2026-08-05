import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Archive, MoreHorizontal, Pencil, Trash2, UserPlus } from 'lucide-react';
import type { RoutineStatus, RoutineSummary } from '../types';

const statusLabels: Record<RoutineStatus, string> = {
    DRAFT: 'Borrador',
    ACTIVE: 'Activa',
    PAUSED: 'Pausada',
    FINISHED: 'Finalizada',
    ARCHIVED: 'Archivada',
};

const statusVariants: Record<RoutineStatus, 'default' | 'secondary' | 'outline'> = {
    DRAFT: 'secondary',
    ACTIVE: 'default',
    PAUSED: 'outline',
    FINISHED: 'outline',
    ARCHIVED: 'outline',
};

function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('es-CR', { day: '2-digit', month: 'short', year: 'numeric' });
}

interface RoutinesTableProps {
    routines: RoutineSummary[];
    onOpen: (id: string) => void;
    onAssign: (routine: RoutineSummary) => void;
    onArchive: (routine: RoutineSummary) => void;
    onDelete: (routine: RoutineSummary) => void;
}

export function RoutinesTable({ routines, onOpen, onAssign, onArchive, onDelete }: RoutinesTableProps) {
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-center">Ejercicios</TableHead>
                    <TableHead>Creada por</TableHead>
                    <TableHead>Actualizada</TableHead>
                    <TableHead className="w-12" />
                </TableRow>
            </TableHeader>
            <TableBody>
                {routines.map((routine) => (
                    <TableRow key={routine.id} className="cursor-pointer" onClick={() => onOpen(routine.id)}>
                        <TableCell>
                            <div className="flex flex-col">
                                <span className="font-medium text-foreground">{routine.name}</span>
                                {routine.objective && (
                                    <span className="max-w-[360px] truncate text-xs text-muted-foreground">
                                        {routine.objective}
                                    </span>
                                )}
                            </div>
                        </TableCell>
                        <TableCell>
                            <Badge variant={statusVariants[routine.status]}>{statusLabels[routine.status]}</Badge>
                        </TableCell>
                        <TableCell className="text-center text-muted-foreground">{routine.exerciseCount}</TableCell>
                        <TableCell className="text-muted-foreground">{routine.createdByName ?? '—'}</TableCell>
                        <TableCell className="text-muted-foreground">{formatDate(routine.updatedAt)}</TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Acciones">
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                {/* Sin esto el contenido hereda el ancho del trigger (un botón
                                    de ícono) y cae a min-w-32, partiendo "Asignar a miembro".
                                    Mismas clases que ReservationActions. */}
                                <DropdownMenuContent align="end" className="w-auto min-w-44 whitespace-nowrap">
                                    <DropdownMenuItem onClick={() => onOpen(routine.id)}>
                                        <Pencil className="h-4 w-4" /> Abrir
                                    </DropdownMenuItem>
                                    {routine.status === 'ACTIVE' && (
                                        <DropdownMenuItem onClick={() => onAssign(routine)}>
                                            <UserPlus className="h-4 w-4" /> Asignar a miembro
                                        </DropdownMenuItem>
                                    )}
                                    {routine.status !== 'ARCHIVED' && (
                                        <DropdownMenuItem onClick={() => onArchive(routine)}>
                                            <Archive className="h-4 w-4" /> Archivar
                                        </DropdownMenuItem>
                                    )}
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem variant="destructive" onClick={() => onDelete(routine)}>
                                        <Trash2 className="h-4 w-4" /> Eliminar
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}
