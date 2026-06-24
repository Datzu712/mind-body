'use client';

import { useState, useMemo } from 'react';
import { DashboardHeader } from '@/src/features/dashboard/components/dashboard-header';
import { PageHeader } from '@/src/shared/components/page-header';
import { ExerciseForm } from '@/src/features/dashboard/training/components/exercise-form';
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
import { Plus, Search, MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Exercise } from '@/src/features/dashboard/training/lib/training-types';

export default function ExercisesPage() {
    const { exercises, addExercise, updateExercise, deleteExercise, hydrated } = useTrainingStorage();
    const [search, setSearch] = useState('');
    const [formOpen, setFormOpen] = useState(false);
    const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);

    const filteredExercises = useMemo(
        () =>
            exercises.filter(
                (e) =>
                    e.name.toLowerCase().includes(search.toLowerCase()) ||
                    (e.muscleGroup || '').toLowerCase().includes(search.toLowerCase()),
            ),
        [exercises, search],
    );

    const handleSubmit = (data: Partial<Exercise>) => {
        if (editingExercise) {
            updateExercise(editingExercise.id, data);
            toast.success('Ejercicio actualizado');
        } else {
            addExercise(data as Omit<Exercise, 'id'>);
            toast.success('Ejercicio creado');
        }
        return Promise.resolve({ success: true });
    };

    const handleDelete = (id: string) => {
        deleteExercise(id);
        toast.success('Ejercicio eliminado');
    };

    const openEdit = (exercise: Exercise) => {
        setEditingExercise(exercise);
        setFormOpen(true);
    };

    const handleFormClose = (open: boolean) => {
        setFormOpen(open);
        if (!open) setEditingExercise(null);
    };

    return (
        <>
            <DashboardHeader
                breadcrumbs={[
                    { label: 'Mind & Body', href: '/dashboard' },
                    { label: 'Entrenamientos', href: '/dashboard/training' },
                    { label: 'Ejercicios' },
                ]}
            />
            <div className="flex-1 overflow-auto p-6">
                <PageHeader
                    title="Ejercicios"
                    description="Catálogo de ejercicios para construir rutinas."
                    actions={
                        <Button onClick={() => setFormOpen(true)}>
                            <Plus className="mr-2 h-4 w-4" />
                            Nuevo ejercicio
                        </Button>
                    }
                    className="mb-6"
                />

                <div className="mb-6 flex flex-col gap-4 sm:flex-row">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Buscar por nombre o grupo muscular..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9 bg-secondary/50 border-border"
                        />
                    </div>
                </div>

                <div className="rounded-lg border border-border overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/30 hover:bg-muted/30">
                                <TableHead className="text-muted-foreground font-semibold">Nombre</TableHead>
                                <TableHead className="text-muted-foreground font-semibold">Grupo muscular</TableHead>
                                <TableHead className="text-muted-foreground font-semibold">Descripción</TableHead>
                                <TableHead className="text-muted-foreground font-semibold">Estado</TableHead>
                                <TableHead className="text-muted-foreground font-semibold text-right">
                                    Acciones
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {!hydrated ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                                        Cargando...
                                    </TableCell>
                                </TableRow>
                            ) : filteredExercises.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                                        No se encontraron ejercicios.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredExercises.map((exercise) => (
                                    <TableRow key={exercise.id} className="border-border">
                                        <TableCell className="font-medium">{exercise.name}</TableCell>
                                        <TableCell>{exercise.muscleGroup || '-'}</TableCell>
                                        <TableCell className="text-muted-foreground max-w-xs truncate">
                                            {exercise.description || '-'}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={exercise.status === 'ACTIVE' ? 'default' : 'secondary'}>
                                                {exercise.status === 'ACTIVE' ? 'Activo' : 'Inactivo'}
                                            </Badge>
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
                                                        onClick={() => openEdit(exercise)}
                                                        className="cursor-pointer"
                                                    >
                                                        <Edit className="mr-2 h-4 w-4" />
                                                        Editar
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => handleDelete(exercise.id)}
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

                <ExerciseForm
                    open={formOpen}
                    onOpenChange={handleFormClose}
                    exercise={editingExercise}
                    onSubmit={handleSubmit}
                />
            </div>
        </>
    );
}
