import { useEffect, useState } from 'react';
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
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { sileo } from 'sileo';
import type { Routine, RoutineFormData } from '../types';
import { useExercises } from '../hooks';

interface RoutineFormProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    routine?: Routine | null;
    onSubmit: (data: RoutineFormData) => void;
    isPending?: boolean;
}

const emptyExercise = () => ({
    exerciseId: '',
    displayOrder: 0,
    sets: 3,
    reps: '',
    notes: '',
});

export function RoutineForm({ open, onOpenChange, routine, onSubmit, isPending = false }: RoutineFormProps) {
    const { data: exercises } = useExercises();
    const [name, setName] = useState('');
    const [objective, setObjective] = useState('');
    const [changeReason, setChangeReason] = useState('');
    const [items, setItems] = useState<RoutineFormData['exercises']>([emptyExercise()]);
    const isEditing = !!routine;

    useEffect(() => {
        if (open && routine) {
            setName(routine.name);
            setObjective(routine.objective ?? '');
            setChangeReason('');
            setItems(
                routine.exercises.length
                    ? routine.exercises
                          .slice()
                          .sort((a, b) => a.displayOrder - b.displayOrder)
                          .map((e) => ({
                              exerciseId: e.exerciseId,
                              displayOrder: e.displayOrder,
                              sets: e.sets,
                              reps: e.reps,
                              notes: e.notes ?? '',
                          }))
                    : [emptyExercise()],
            );
        } else if (open) {
            setName('');
            setObjective('');
            setChangeReason('');
            setItems([emptyExercise()]);
        }
    }, [open, routine]);

    const handleClose = (next: boolean) => {
        if (!next) {
            setName('');
            setObjective('');
            setChangeReason('');
            setItems([emptyExercise()]);
        }
        onOpenChange(next);
    };

    const updateItem = (index: number, patch: Partial<RoutineFormData['exercises'][number]>) => {
        setItems((prev) =>
            prev.map((item, i) =>
                i === index
                    ? {
                          ...item,
                          ...patch,
                      }
                    : item,
            ),
        );
    };

    const removeItem = (index: number) => {
        setItems((prev) => prev.filter((_, i) => i !== index).map((item, i) => ({ ...item, displayOrder: i + 1 })));
    };

    const addItem = () => {
        setItems((prev) => [
            ...prev,
            {
                ...emptyExercise(),
                displayOrder: prev.length + 1,
            },
        ]);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            sileo.error({ title: 'El nombre es obligatorio' });
            return;
        }
        const valid = items.filter((it) => it.exerciseId.trim() !== '');
        if (valid.length === 0) {
            sileo.error({ title: 'Agregá al menos un ejercicio' });
            return;
        }
        onSubmit({
            name: name.trim(),
            objective: objective.trim() || undefined,
            exercises: valid.map((it, i) => ({ ...it, displayOrder: i + 1 })),
            ...(isEditing && changeReason.trim() ? { changeReason: changeReason.trim() } : {}),
        });
    };

    const canSubmit = name.trim().length > 0 && items.some((it) => it.exerciseId.trim() !== '') && !isPending;

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="bg-card border-border sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-foreground">
                        {isEditing ? 'Editar rutina' : 'Nueva rutina'}
                    </DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                        {isEditing
                            ? 'Modificá los datos y ejercicios de la rutina.'
                            : 'Completá el nombre, objetivo y ejercicios de la rutina.'}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="routine-name">
                                Nombre <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="routine-name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Ej: Pecho y tríceps"
                                required
                                className="bg-secondary/50 border-border"
                            />
                        </div>
                        <div className="flex flex-col gap-2 md:col-span-2">
                            <Label htmlFor="routine-objective">Objetivo</Label>
                            <Textarea
                                id="routine-objective"
                                value={objective}
                                onChange={(e) => setObjective(e.target.value)}
                                placeholder="Ej: Hipertrofia de tren superior"
                                className="bg-secondary/50 border-border min-h-[80px]"
                            />
                        </div>
                        {isEditing && (
                            <div className="flex flex-col gap-2 md:col-span-2">
                                <Label htmlFor="routine-change-reason">Motivo del cambio</Label>
                                <Textarea
                                    id="routine-change-reason"
                                    value={changeReason}
                                    onChange={(e) => setChangeReason(e.target.value)}
                                    placeholder="Ej: Ajuste de cargas y ejercicios"
                                    className="bg-secondary/50 border-border min-h-[60px]"
                                />
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                            <Label>Ejercicios</Label>
                            <Button type="button" variant="outline" size="sm" onClick={addItem}>
                                <Plus className="mr-1.5 h-4 w-4" />
                                Agregar ejercicio
                            </Button>
                        </div>

                        {items.map((item, index) => (
                            <div
                                key={index}
                                className="grid gap-3 rounded-lg border border-border bg-secondary/20 p-3 md:grid-cols-[1fr_80px_100px_1fr_auto] items-end"
                            >
                                <div className="flex flex-col gap-1.5">
                                    <Label className="text-xs text-muted-foreground">Ejercicio</Label>
                                    <Select
                                        value={item.exerciseId}
                                        onValueChange={(v) => updateItem(index, { exerciseId: v })}
                                    >
                                        <SelectTrigger className="bg-secondary/50 border-border">
                                            <SelectValue placeholder="Seleccionar..." />
                                        </SelectTrigger>
                                        <SelectContent className="bg-popover border-border max-h-60">
                                            {exercises?.map((ex) => (
                                                <SelectItem key={ex.id} value={ex.id}>
                                                    {ex.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <Label className="text-xs text-muted-foreground">Series</Label>
                                    <Input
                                        type="number"
                                        min={1}
                                        value={item.sets ?? ''}
                                        onChange={(e) => updateItem(index, { sets: parseInt(e.target.value) || 1 })}
                                        className="bg-secondary/50 border-border"
                                    />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <Label className="text-xs text-muted-foreground">Reps</Label>
                                    <Input
                                        value={item.reps ?? ''}
                                        onChange={(e) => updateItem(index, { reps: e.target.value })}
                                        placeholder="10"
                                        className="bg-secondary/50 border-border"
                                    />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <Label className="text-xs text-muted-foreground">Notas</Label>
                                    <Input
                                        value={item.notes}
                                        onChange={(e) => updateItem(index, { notes: e.target.value })}
                                        placeholder="Observaciones"
                                        className="bg-secondary/50 border-border"
                                    />
                                </div>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="text-destructive"
                                    onClick={() => removeItem(index)}
                                    disabled={items.length === 1}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                    </div>

                    <DialogFooter className="gap-2">
                        <Button type="button" variant="outline" onClick={() => handleClose(false)}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={!canSubmit}>
                            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isEditing ? 'Guardar cambios' : 'Crear rutina'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
