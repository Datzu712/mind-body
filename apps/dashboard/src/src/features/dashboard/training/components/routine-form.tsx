'use client';

import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, GripVertical, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import { AttachmentList } from './attachment-list';
import { RoutineVersions } from './routine-versions';
import type { Exercise, Routine, RoutineExercise, RoutineStatus } from '../lib/training-types';

interface RoutineFormProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    routine?: Routine | null;
    exercises: Exercise[];
    onSubmit: (
        data: Partial<Routine>,
        options?: { versionNote?: string },
    ) => Promise<{ success: boolean; error?: string }>;
    onAddAttachment: (routineId: string, attachment: Omit<Routine['attachments'][number], 'id'>) => void;
    onRemoveAttachment: (routineId: string, attachmentId: string) => void;
}

export function RoutineForm({
    open,
    onOpenChange,
    routine,
    exercises,
    onSubmit,
    onAddAttachment,
    onRemoveAttachment,
}: RoutineFormProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [versionNote, setVersionNote] = useState('');
    const [formData, setFormData] = useState<{
        name: string;
        objective: string;
        status: RoutineStatus;
        exercises: RoutineExercise[];
    }>({
        name: '',
        objective: '',
        status: 'DRAFT',
        exercises: [],
    });

    const isEditing = !!routine;

    useEffect(() => {
        if (open) {
            setFormData({
                name: routine?.name || '',
                objective: routine?.objective || '',
                status: routine?.status || 'DRAFT',
                exercises: routine?.exercises ? [...routine.exercises] : [],
            });
            setVersionNote('');
            setError(null);
        }
    }, [open, routine]);

    const activeExercises = exercises.filter((e) => e.status === 'ACTIVE');
    const selectedExerciseIds = new Set(formData.exercises.map((e) => e.exerciseId));

    const addExercise = (exerciseId: string) => {
        if (selectedExerciseIds.has(exerciseId)) return;
        const exercise = exercises.find((e) => e.id === exerciseId);
        if (!exercise) return;
        const newItem: RoutineExercise = {
            id: `re-${Date.now()}`,
            exerciseId,
            displayOrder: formData.exercises.length + 1,
            sets: 3,
            reps: '10',
            notes: '',
        };
        setFormData((prev) => ({ ...prev, exercises: [...prev.exercises, newItem] }));
    };

    const removeRoutineExercise = (id: string) => {
        setFormData((prev) => ({
            ...prev,
            exercises: prev.exercises.filter((e) => e.id !== id).map((e, i) => ({ ...e, displayOrder: i + 1 })),
        }));
    };

    const updateRoutineExercise = (id: string, patch: Partial<RoutineExercise>) => {
        setFormData((prev) => ({
            ...prev,
            exercises: prev.exercises.map((e) => (e.id === id ? { ...e, ...patch } : e)),
        }));
    };

    const moveExercise = (index: number, direction: -1 | 1) => {
        const newIndex = index + direction;
        if (newIndex < 0 || newIndex >= formData.exercises.length) return;
        const items = [...formData.exercises];
        const [moved] = items.splice(index, 1);
        items.splice(newIndex, 0, moved);
        setFormData((prev) => ({
            ...prev,
            exercises: items.map((e, i) => ({ ...e, displayOrder: i + 1 })),
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name.trim()) {
            setError('El nombre de la rutina es obligatorio.');
            return;
        }
        if (formData.exercises.length === 0) {
            setError('Agrega al menos un ejercicio.');
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const result = await onSubmit(
                {
                    name: formData.name,
                    objective: formData.objective,
                    status: formData.status,
                    exercises: formData.exercises,
                },
                { versionNote: isEditing ? versionNote || 'Actualización' : undefined },
            );
            if (result.success) {
                onOpenChange(false);
                setFormData({ name: '', objective: '', status: 'DRAFT', exercises: [] });
            } else {
                setError(result.error || 'Ocurrió un error');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-card border-border max-h-[90vh] overflow-y-auto sm:max-w-3xl">
                <DialogHeader>
                    <DialogTitle className="text-foreground">
                        {isEditing ? 'Editar Rutina' : 'Nueva Rutina'}
                    </DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                        {isEditing
                            ? 'Modifica los ejercicios y datos de la rutina.'
                            : 'Crea una rutina con ejercicios, series y repeticiones.'}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-6">
                    {error && (
                        <div className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                            {error}
                        </div>
                    )}

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="routine-name">Nombre</Label>
                            <Input
                                id="routine-name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Ej. Rutina de fuerza"
                                className="bg-secondary/50 border-border"
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <Label htmlFor="routine-status">Estado</Label>
                            <Select
                                value={formData.status}
                                onValueChange={(value) => setFormData({ ...formData, status: value as RoutineStatus })}
                            >
                                <SelectTrigger id="routine-status" className="bg-secondary/50 border-border">
                                    <SelectValue placeholder="Estado" />
                                </SelectTrigger>
                                <SelectContent className="bg-popover border-border">
                                    <SelectItem value="DRAFT">Borrador</SelectItem>
                                    <SelectItem value="ACTIVE">Activa</SelectItem>
                                    <SelectItem value="PAUSED">Pausada</SelectItem>
                                    <SelectItem value="FINISHED">Finalizada</SelectItem>
                                    <SelectItem value="ARCHIVED">Archivada</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="flex flex-col gap-2">
                        <Label htmlFor="routine-objective">Objetivo</Label>
                        <Textarea
                            id="routine-objective"
                            value={formData.objective}
                            onChange={(e) => setFormData({ ...formData, objective: e.target.value })}
                            placeholder="Ej. Ganar fuerza general en 4 semanas"
                            className="bg-secondary/50 border-border"
                        />
                    </div>

                    <div className="flex flex-col gap-3">
                        <Label>Ejercicios</Label>
                        <Select value="" onValueChange={addExercise}>
                            <SelectTrigger className="bg-secondary/50 border-border">
                                <SelectValue placeholder="Agregar ejercicio..." />
                            </SelectTrigger>
                            <SelectContent className="bg-popover border-border">
                                {activeExercises.length === 0 && (
                                    <SelectItem value="none" disabled>
                                        No hay ejercicios activos
                                    </SelectItem>
                                )}
                                {activeExercises.map((exercise) => (
                                    <SelectItem
                                        key={exercise.id}
                                        value={exercise.id}
                                        disabled={selectedExerciseIds.has(exercise.id)}
                                    >
                                        {exercise.name}
                                        {selectedExerciseIds.has(exercise.id) && ' (ya agregado)'}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {formData.exercises.length === 0 ? (
                            <div className="rounded-md border border-dashed border-border bg-secondary/20 p-6 text-center text-sm text-muted-foreground">
                                Agrega ejercicios desde el selector.
                            </div>
                        ) : (
                            <div className="flex flex-col gap-3">
                                {formData.exercises.map((exercise, index) => {
                                    const exerciseInfo = exercises.find((e) => e.id === exercise.exerciseId);
                                    return (
                                        <Card key={exercise.id} className="border-border">
                                            <CardContent className="flex flex-col gap-3 p-4">
                                                <div className="flex items-center justify-between gap-2">
                                                    <div className="flex items-center gap-2 overflow-hidden">
                                                        <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground" />
                                                        <Badge variant="outline" className="shrink-0">
                                                            #{index + 1}
                                                        </Badge>
                                                        <span className="truncate font-medium">
                                                            {exerciseInfo?.name}
                                                        </span>
                                                    </div>
                                                    <div className="flex shrink-0 items-center gap-1">
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-7 w-7"
                                                            disabled={index === 0}
                                                            onClick={() => moveExercise(index, -1)}
                                                        >
                                                            <ArrowUp className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-7 w-7"
                                                            disabled={index === formData.exercises.length - 1}
                                                            onClick={() => moveExercise(index, 1)}
                                                        >
                                                            <ArrowDown className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-7 w-7 text-destructive"
                                                            onClick={() => removeRoutineExercise(exercise.id)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                                <div className="grid gap-3 sm:grid-cols-3">
                                                    <div className="flex flex-col gap-1">
                                                        <Label className="text-xs text-muted-foreground">Series</Label>
                                                        <Input
                                                            type="number"
                                                            min={1}
                                                            value={exercise.sets ?? ''}
                                                            onChange={(e) =>
                                                                updateRoutineExercise(exercise.id, {
                                                                    sets:
                                                                        e.target.value === ''
                                                                            ? undefined
                                                                            : Number(e.target.value),
                                                                })
                                                            }
                                                            className="bg-secondary/50 border-border"
                                                        />
                                                    </div>
                                                    <div className="flex flex-col gap-1">
                                                        <Label className="text-xs text-muted-foreground">
                                                            Repeticiones
                                                        </Label>
                                                        <Input
                                                            value={exercise.reps || ''}
                                                            onChange={(e) =>
                                                                updateRoutineExercise(exercise.id, {
                                                                    reps: e.target.value,
                                                                })
                                                            }
                                                            placeholder="Ej. 10-12"
                                                            className="bg-secondary/50 border-border"
                                                        />
                                                    </div>
                                                    <div className="flex flex-col gap-1 sm:col-span-1">
                                                        <Label className="text-xs text-muted-foreground">Notas</Label>
                                                        <Input
                                                            value={exercise.notes || ''}
                                                            onChange={(e) =>
                                                                updateRoutineExercise(exercise.id, {
                                                                    notes: e.target.value,
                                                                })
                                                            }
                                                            placeholder="Notas"
                                                            className="bg-secondary/50 border-border"
                                                        />
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {isEditing && routine && (
                        <>
                            <AttachmentList
                                attachments={routine.attachments}
                                onAdd={(attachment) => onAddAttachment(routine.id, attachment)}
                                onRemove={(id) => onRemoveAttachment(routine.id, id)}
                            />
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="version-note">Nota de versión (opcional)</Label>
                                <Input
                                    id="version-note"
                                    value={versionNote}
                                    onChange={(e) => setVersionNote(e.target.value)}
                                    placeholder="Ej. Ajusté series y repeticiones"
                                    className="bg-secondary/50 border-border"
                                />
                            </div>
                            <RoutineVersions versions={routine.versions} exercises={exercises} />
                        </>
                    )}

                    <DialogFooter className="mt-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            className="border-border"
                        >
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isEditing ? 'Guardar cambios' : 'Crear rutina'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
