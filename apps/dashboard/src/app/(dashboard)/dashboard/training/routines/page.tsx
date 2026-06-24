'use client';

import { useState, useMemo } from 'react';
import { DashboardHeader } from '@/src/features/dashboard/components/dashboard-header';
import { PageHeader } from '@/src/shared/components/page-header';
import { RoutineForm } from '@/src/features/dashboard/training/components/routine-form';
import { AssignRoutineDialog } from '@/src/features/dashboard/training/components/assign-routine-dialog';
import { useTrainingStorage } from '@/src/features/dashboard/training/lib/use-training-storage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Search, MoreHorizontal, Edit, Trash2, UserPlus, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Routine } from '@/src/features/dashboard/training/lib/training-types';

const statusLabels: Record<Routine['status'], string> = {
    DRAFT: 'Borrador',
    ACTIVE: 'Activa',
    PAUSED: 'Pausada',
    FINISHED: 'Finalizada',
    ARCHIVED: 'Archivada',
};

const statusBadgeVariant: Record<Routine['status'], 'default' | 'secondary' | 'outline' | 'destructive'> = {
    DRAFT: 'secondary',
    ACTIVE: 'default',
    PAUSED: 'outline',
    FINISHED: 'outline',
    ARCHIVED: 'destructive',
};

export default function RoutinesPage() {
    const storage = useTrainingStorage();
    const { exercises, routines, assignments, members, hydrated } = storage;
    const [search, setSearch] = useState('');
    const [formOpen, setFormOpen] = useState(false);
    const [assignOpen, setAssignOpen] = useState(false);
    const [editingRoutine, setEditingRoutine] = useState<Routine | null>(null);
    const [selectedRoutineId, setSelectedRoutineId] = useState<string | null>(null);

    const filteredRoutines = useMemo(
        () => routines.filter((r) => r.name.toLowerCase().includes(search.toLowerCase())),
        [routines, search],
    );

    const handleSubmit = (data: Partial<Routine>, options?: { versionNote?: string }) => {
        if (editingRoutine) {
            storage.updateRoutine(editingRoutine.id, data, options?.versionNote);
            toast.success('Rutina actualizada');
        } else {
            storage.addRoutine(data as Omit<Routine, 'id' | 'createdAt' | 'updatedAt' | 'versions' | 'attachments'>);
            toast.success('Rutina creada');
        }
        return Promise.resolve({ success: true });
    };

    const handleDelete = (id: string) => {
        storage.deleteRoutine(id);
        toast.success('Rutina eliminada');
    };

    const openEdit = (routine: Routine) => {
        setEditingRoutine(routine);
        setFormOpen(true);
    };

    const openAssign = (routine: Routine) => {
        setSelectedRoutineId(routine.id);
        setAssignOpen(true);
    };

    const handleFormClose = (open: boolean) => {
        setFormOpen(open);
        if (!open) setEditingRoutine(null);
    };

    const assignmentsWithNames = useMemo(
        () =>
            assignments.map((a) => ({
                ...a,
                memberName: members.find((m) => m.id === a.memberId)?.name || 'Miembro desconocido',
                routineName: routines.find((r) => r.id === a.routineId)?.name || 'Rutina eliminada',
            })),
        [assignments, members, routines],
    );

    return (
        <>
            <DashboardHeader
                breadcrumbs={[
                    { label: 'Mind & Body', href: '/dashboard' },
                    { label: 'Entrenamientos', href: '/dashboard/training' },
                    { label: 'Rutinas' },
                ]}
            />
            <div className="flex-1 overflow-auto p-6">
                <PageHeader
                    title="Rutinas"
                    description="Crea, edita y asigna rutinas de entrenamiento."
                    actions={
                        <Button onClick={() => setFormOpen(true)}>
                            <Plus className="mr-2 h-4 w-4" />
                            Nueva rutina
                        </Button>
                    }
                    className="mb-6"
                />

                <div className="mb-6 flex flex-col gap-4 sm:flex-row">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Buscar por nombre..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9 bg-secondary/50 border-border"
                        />
                    </div>
                </div>

                <div className="mb-8 rounded-lg border border-border overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/30 hover:bg-muted/30">
                                <TableHead className="text-muted-foreground font-semibold">Nombre</TableHead>
                                <TableHead className="text-muted-foreground font-semibold">Objetivo</TableHead>
                                <TableHead className="text-muted-foreground font-semibold">Estado</TableHead>
                                <TableHead className="text-muted-foreground font-semibold">Ejercicios</TableHead>
                                <TableHead className="text-muted-foreground font-semibold">Adjuntos</TableHead>
                                <TableHead className="text-muted-foreground font-semibold text-right">
                                    Acciones
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {!hydrated ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                                        Cargando...
                                    </TableCell>
                                </TableRow>
                            ) : filteredRoutines.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                                        No se encontraron rutinas.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredRoutines.map((routine) => (
                                    <TableRow key={routine.id} className="border-border">
                                        <TableCell className="font-medium">{routine.name}</TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {routine.objective || '-'}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={statusBadgeVariant[routine.status]}>
                                                {statusLabels[routine.status]}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{routine.exercises.length}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1">
                                                <FileText className="h-4 w-4 text-muted-foreground" />
                                                {routine.attachments.length}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                        <span className="sr-only">Acciones</span>
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="bg-popover border-border">
                                                    <DropdownMenuItem
                                                        onClick={() => openEdit(routine)}
                                                        className="cursor-pointer"
                                                    >
                                                        <Edit className="mr-2 h-4 w-4" />
                                                        Editar
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => openAssign(routine)}
                                                        className="cursor-pointer"
                                                    >
                                                        <UserPlus className="mr-2 h-4 w-4" />
                                                        Asignar a miembro
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => handleDelete(routine.id)}
                                                        className="cursor-pointer text-destructive focus:text-destructive"
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

                <Card className="border-border bg-card">
                    <CardHeader>
                        <CardTitle className="text-base">Asignaciones activas</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {!hydrated ? (
                            <p className="text-sm text-muted-foreground">Cargando...</p>
                        ) : assignmentsWithNames.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No hay asignaciones registradas.</p>
                        ) : (
                            <ul className="flex flex-col gap-2">
                                {assignmentsWithNames.map((assignment) => (
                                    <li
                                        key={assignment.id}
                                        className="flex items-center justify-between rounded-md border border-border bg-secondary/20 px-3 py-2"
                                    >
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium">{assignment.routineName}</span>
                                            <span className="text-xs text-muted-foreground">
                                                {assignment.memberName} •{' '}
                                                {format(new Date(assignment.assignedAt), 'dd/MM/yyyy', { locale: es })}
                                            </span>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-destructive"
                                            onClick={() => {
                                                storage.unassignRoutine(assignment.id);
                                                toast.success('Asignación eliminada');
                                            }}
                                        >
                                            Eliminar
                                        </Button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </CardContent>
                </Card>

                <RoutineForm
                    open={formOpen}
                    onOpenChange={handleFormClose}
                    routine={editingRoutine}
                    exercises={exercises}
                    onSubmit={handleSubmit}
                    onAddAttachment={storage.addAttachment}
                    onRemoveAttachment={storage.removeAttachment}
                />

                {selectedRoutineId && (
                    <AssignRoutineDialog
                        open={assignOpen}
                        onOpenChange={(open) => {
                            setAssignOpen(open);
                            if (!open) setSelectedRoutineId(null);
                        }}
                        routineId={selectedRoutineId}
                        members={members}
                        assignments={assignments}
                        onAssign={(data) => {
                            storage.assignRoutine(data);
                            toast.success('Rutina asignada');
                            return Promise.resolve({ success: true });
                        }}
                    />
                )}
            </div>
        </>
    );
}
