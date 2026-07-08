import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Edit, Power, Trash2 } from 'lucide-react';

import { ClassStatusBadge } from './ClassStatusBadge';
import { type ManagedClass } from '../mock-classes';

interface ClassesTableProps {
    classes: ManagedClass[];
    onEdit: (cls: ManagedClass) => void;
    onToggleStatus: (cls: ManagedClass) => void;
    onDelete: (cls: ManagedClass) => void;
}

export function ClassesTable({ classes, onEdit, onToggleStatus, onDelete }: ClassesTableProps) {
    return (
        <Card className="border-border bg-card">
            <CardContent className="p-0">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/30 hover:bg-muted/30">
                                <TableHead className="text-muted-foreground font-semibold">Clase</TableHead>
                                <TableHead className="text-muted-foreground font-semibold">Entrenador</TableHead>
                                <TableHead className="text-muted-foreground font-semibold">Día y hora</TableHead>
                                <TableHead className="text-muted-foreground font-semibold">Cupos</TableHead>
                                <TableHead className="text-muted-foreground font-semibold">Estado</TableHead>
                                <TableHead className="text-muted-foreground font-semibold text-right">
                                    Acciones
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {classes.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                        No se encontraron clases.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                classes.map((cls) => (
                                    <TableRow key={cls.id} className="border-border">
                                        <TableCell className="font-medium text-foreground">{cls.name}</TableCell>
                                        <TableCell className="text-muted-foreground">{cls.trainer}</TableCell>
                                        <TableCell className="text-muted-foreground whitespace-nowrap">
                                            {cls.day} {cls.time}
                                        </TableCell>
                                        <TableCell className="whitespace-nowrap">
                                            <span className="font-medium text-foreground">
                                                {cls.booked} / {cls.capacity}
                                            </span>
                                            {cls.waitlistCount > 0 && (
                                                <span className="ml-2 text-xs text-warning">
                                                    +{cls.waitlistCount} en espera
                                                </span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <ClassStatusBadge status={cls.status} />
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8"
                                                        aria-label={`Acciones para ${cls.name}`}
                                                    >
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent
                                                    align="end"
                                                    className="bg-popover border-border"
                                                >
                                                    <DropdownMenuItem
                                                        className="cursor-pointer"
                                                        onClick={() => onEdit(cls)}
                                                    >
                                                        <Edit className="mr-2 h-4 w-4" />
                                                        Editar
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        className="cursor-pointer"
                                                        onClick={() => onToggleStatus(cls)}
                                                    >
                                                        <Power className="mr-2 h-4 w-4" />
                                                        {cls.status === 'inactive' ? 'Activar' : 'Desactivar'}
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator className="bg-border" />
                                                    <DropdownMenuItem
                                                        className="cursor-pointer text-destructive focus:text-destructive"
                                                        onClick={() => onDelete(cls)}
                                                    >
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        Eliminar
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}
