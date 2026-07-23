import { useEffect, useMemo, useState } from 'react';
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
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Trash2, ArrowUp, ArrowDown, Check, FileUp, X, Paperclip } from 'lucide-react';
import { sileo } from 'sileo';
import type { Routine, RoutineAttachmentMock, RoutineFormData } from '../types';
import { useExercises } from '../hooks';
import { getRoutineMockAttachments } from '../mock-attachments';

interface RoutineFormProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    routine?: Routine | null;
    onSubmit: (data: RoutineFormData) => void;
    isPending?: boolean;
}

const steps = ['Datos generales', 'Ejercicios', 'Material y revisión'] as const;
const allowedTypes = new Set(['application/pdf', 'image/jpeg', 'image/png', 'image/webp']);
const maxAttachmentSize = 10 * 1024 * 1024;
const maxAttachments = 5;

const emptyExercise = (): RoutineFormData['exercises'][number] => ({
    exerciseId: '',
    displayOrder: 1,
    sets: 3,
    reps: '',
    restSeconds: 60,
    notes: '',
});

function formatRest(seconds: number) {
    return seconds === 0 ? 'Sin descanso' : `${seconds} s`;
}

function formatFileSize(size: number) {
    if (size >= 1024 * 1024) return `${(size / 1024 / 1024).toFixed(1)} MiB`;
    return `${Math.max(1, Math.round(size / 1024))} KiB`;
}

export function RoutineForm({ open, onOpenChange, routine, onSubmit, isPending = false }: RoutineFormProps) {
    const { data: exercises, isLoading: exercisesLoading, isError: exercisesError, refetch } = useExercises();
    const [step, setStep] = useState(0);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [name, setName] = useState('');
    const [objective, setObjective] = useState('');
    const [changeReason, setChangeReason] = useState('');
    const [items, setItems] = useState<RoutineFormData['exercises']>([emptyExercise()]);
    const [attachments, setAttachments] = useState<RoutineAttachmentMock[]>([]);
    const isEditing = !!routine;

    useEffect(() => {
        if (open && routine) {
            setStep(0);
            setSelectedIndex(0);
            setName(routine.name);
            setObjective(routine.objective ?? '');
            setChangeReason('');
            setAttachments(getRoutineMockAttachments(routine.id));
            setItems(
                routine.exercises.length
                    ? routine.exercises
                          .slice()
                          .sort((a, b) => a.displayOrder - b.displayOrder)
                          .map((e) => ({
                              routineExerciseId: e.id,
                              exerciseId: e.exerciseId,
                              displayOrder: e.displayOrder,
                              sets: e.sets,
                              reps: e.reps,
                              restSeconds: e.restSeconds ?? 60,
                              notes: e.notes ?? '',
                          }))
                    : [emptyExercise()],
            );
        } else if (open) {
            setStep(0);
            setSelectedIndex(0);
            setName('');
            setObjective('');
            setChangeReason('');
            setAttachments([]);
            setItems([emptyExercise()]);
        }
    }, [open, routine]);

    const exerciseNameById = useMemo(() => new Map((exercises ?? []).map((e) => [e.id, e.name])), [exercises]);
    const selected = items[selectedIndex] ?? items[0];
    const hasDraft = Boolean(
        name.trim() ||
        objective.trim() ||
        changeReason.trim() ||
        attachments.length ||
        items.some((it) => it.exerciseId || it.reps || it.notes || it.restSeconds !== 60 || it.sets !== 3),
    );

    const handleClose = (next: boolean) => {
        if (!next && hasDraft && !isPending && !window.confirm('Tenés cambios sin guardar. ¿Deseas descartarlos?')) {
            return;
        }
        onOpenChange(next);
    };

    const updateItem = (index: number, patch: Partial<RoutineFormData['exercises'][number]>) => {
        setItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
    };

    const normalizeOrder = (rows: RoutineFormData['exercises']) =>
        rows.map((item, i) => ({ ...item, displayOrder: i + 1 }));

    const addItem = () => {
        setItems((prev) => {
            const next = normalizeOrder([...prev, { ...emptyExercise(), displayOrder: prev.length + 1 }]);
            setSelectedIndex(next.length - 1);
            return next;
        });
    };

    const removeItem = (index: number) => {
        if (items.length === 1) return;
        setItems((prev) => {
            const next = normalizeOrder(prev.filter((_, i) => i !== index));
            setSelectedIndex(Math.max(0, Math.min(index, next.length - 1)));
            return next;
        });
    };

    const moveItem = (index: number, direction: -1 | 1) => {
        const target = index + direction;
        if (target < 0 || target >= items.length) return;
        setItems((prev) => {
            const next = [...prev];
            [next[index], next[target]] = [next[target], next[index]];
            setSelectedIndex(target);
            return normalizeOrder(next);
        });
    };

    const validateStep = (targetStep = step) => {
        if (targetStep >= 0 && !name.trim()) {
            sileo.error({ title: 'El nombre es obligatorio' });
            setStep(0);
            return false;
        }
        if (targetStep >= 1) {
            if (exercisesLoading || exercisesError) {
                sileo.error({ title: 'El catálogo de ejercicios no está disponible' });
                return false;
            }
            const invalidIndex = items.findIndex(
                (it) =>
                    !it.exerciseId ||
                    it.restSeconds < 0 ||
                    it.restSeconds > 600 ||
                    !Number.isInteger(it.restSeconds) ||
                    (it.sets != null && (it.sets < 1 || it.sets > 99 || !Number.isInteger(it.sets))),
            );
            if (invalidIndex >= 0) {
                setStep(1);
                setSelectedIndex(invalidIndex);
                sileo.error({ title: `Revisa el ejercicio ${invalidIndex + 1}` });
                return false;
            }
        }
        return true;
    };

    const nextStep = () => {
        if (!validateStep(step)) return;
        setStep((s) => Math.min(steps.length - 1, s + 1));
    };

    const handleFiles = (files: FileList | null) => {
        if (!files) return;
        const accepted = [...attachments];
        for (const file of Array.from(files)) {
            if (accepted.length >= maxAttachments) {
                sileo.error({ title: 'Máximo 5 adjuntos por rutina' });
                break;
            }
            if (!allowedTypes.has(file.type)) {
                sileo.error({ title: `${file.name}: formato no permitido`, description: 'Usa PDF, JPG, PNG o WEBP.' });
                continue;
            }
            if (file.size > maxAttachmentSize) {
                sileo.error({ title: `${file.name}: supera 10 MiB` });
                continue;
            }
            if (accepted.some((a) => a.name === file.name && a.size === file.size)) {
                sileo.error({ title: `${file.name}: adjunto duplicado` });
                continue;
            }
            accepted.push({
                id: `${file.name}-${file.size}-${Date.now()}`,
                name: file.name,
                size: file.size,
                type: file.type,
                url: URL.createObjectURL(file),
            });
        }
        setAttachments(accepted);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateStep(steps.length - 1)) return;
        onSubmit({
            name: name.trim(),
            objective: objective.trim() || undefined,
            exercises: normalizeOrder(items).map((it) => ({
                ...it,
                reps: it.reps?.trim() || null,
                notes: it.notes?.trim() || undefined,
            })),
            mockAttachments: attachments,
            ...(isEditing && changeReason.trim() ? { changeReason: changeReason.trim() } : {}),
        });
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="bg-card border-border flex max-h-[90vh] flex-col overflow-hidden sm:max-w-4xl">
                <DialogHeader>
                    <DialogTitle className="text-foreground">
                        {isEditing ? 'Editar rutina' : 'Nueva rutina'}
                    </DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                        Completa los pasos sin perder el borrador. Los adjuntos son mock de frontend.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col gap-4">
                    <div className="grid gap-2 sm:grid-cols-3" aria-label="Pasos del formulario">
                        {steps.map((label, index) => (
                            <button
                                key={label}
                                type="button"
                                onClick={() => index <= step && setStep(index)}
                                className={`rounded-lg border px-3 py-2 text-left text-sm transition ${
                                    step === index
                                        ? 'border-primary bg-primary/10 text-primary'
                                        : index < step
                                          ? 'border-success/40 bg-success/10 text-success'
                                          : 'border-border bg-secondary/30 text-muted-foreground'
                                }`}
                                aria-current={step === index ? 'step' : undefined}
                            >
                                <span className="flex items-center gap-2 font-medium">
                                    {index < step ? <Check className="h-4 w-4" /> : <span>{index + 1}</span>}
                                    {label}
                                </span>
                            </button>
                        ))}
                    </div>

                    <div className="min-h-0 flex-1 overflow-y-auto pr-1">
                        {step === 0 && (
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="routine-name">Nombre *</Label>
                                    <Input
                                        id="routine-name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Ej: Pecho y triceps"
                                        maxLength={120}
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
                                        className="bg-secondary/50 border-border min-h-[92px]"
                                    />
                                </div>
                                {isEditing && (
                                    <div className="flex flex-col gap-2 md:col-span-2">
                                        <Label htmlFor="routine-change-reason">Motivo del cambio</Label>
                                        <Textarea
                                            id="routine-change-reason"
                                            value={changeReason}
                                            onChange={(e) => setChangeReason(e.target.value)}
                                            placeholder="Ej: Ajuste de descanso y orden"
                                            className="bg-secondary/50 border-border min-h-[72px]"
                                        />
                                    </div>
                                )}
                            </div>
                        )}

                        {step === 1 && (
                            <div className="grid gap-4 lg:grid-cols-[minmax(240px,320px)_1fr]">
                                <div className="flex min-h-0 flex-col gap-3">
                                    <div className="flex items-center justify-between">
                                        <Label>Ejercicios</Label>
                                        <Button type="button" variant="outline" size="sm" onClick={addItem}>
                                            <Plus className="mr-1.5 h-4 w-4" />
                                            Agregar
                                        </Button>
                                    </div>
                                    <div className="max-h-[360px] overflow-y-auto rounded-lg border border-border bg-secondary/20 p-2">
                                        {items.map((item, index) => (
                                            <button
                                                key={`${item.routineExerciseId ?? 'new'}-${index}`}
                                                type="button"
                                                onClick={() => setSelectedIndex(index)}
                                                className={`mb-2 w-full rounded-md border p-3 text-left ${
                                                    selectedIndex === index
                                                        ? 'border-primary bg-primary/10'
                                                        : 'border-border bg-card'
                                                }`}
                                            >
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className="text-sm font-semibold text-foreground">
                                                        #{index + 1}{' '}
                                                        {item.exerciseId
                                                            ? (exerciseNameById.get(item.exerciseId) ?? 'Ejercicio')
                                                            : 'Sin seleccionar'}
                                                    </span>
                                                    {!item.exerciseId && <Badge variant="destructive">Falta</Badge>}
                                                </div>
                                                <p className="mt-1 text-xs text-muted-foreground">
                                                    {item.sets ?? '-'} x {item.reps || '-'} ·{' '}
                                                    {formatRest(item.restSeconds)}
                                                </p>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {selected && (
                                    <div className="rounded-lg border border-border bg-secondary/20 p-4">
                                        {exercisesLoading ? (
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                Cargando catálogo...
                                            </div>
                                        ) : exercisesError ? (
                                            <div className="flex items-center justify-between gap-3">
                                                <p className="text-sm text-destructive">
                                                    No se pudo cargar el catálogo.
                                                </p>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => void refetch()}
                                                >
                                                    Reintentar
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="grid gap-4 md:grid-cols-2">
                                                <div className="flex flex-col gap-1.5 md:col-span-2">
                                                    <Label>Ejercicio *</Label>
                                                    <Select
                                                        value={selected.exerciseId}
                                                        onValueChange={(v) =>
                                                            updateItem(selectedIndex, { exerciseId: v })
                                                        }
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
                                                    <Label>Series</Label>
                                                    <Input
                                                        type="number"
                                                        min={1}
                                                        max={99}
                                                        value={selected.sets ?? ''}
                                                        onChange={(e) =>
                                                            updateItem(selectedIndex, {
                                                                sets:
                                                                    e.target.value === ''
                                                                        ? null
                                                                        : Number(e.target.value),
                                                            })
                                                        }
                                                        className="bg-secondary/50 border-border"
                                                    />
                                                </div>
                                                <div className="flex flex-col gap-1.5">
                                                    <Label>Repeticiones</Label>
                                                    <Input
                                                        value={selected.reps ?? ''}
                                                        maxLength={40}
                                                        onChange={(e) =>
                                                            updateItem(selectedIndex, { reps: e.target.value })
                                                        }
                                                        placeholder="10, 8, 8"
                                                        className="bg-secondary/50 border-border"
                                                    />
                                                </div>
                                                <div className="flex flex-col gap-1.5">
                                                    <Label>Descanso entre series *</Label>
                                                    <Input
                                                        type="number"
                                                        min={0}
                                                        max={600}
                                                        step={1}
                                                        value={selected.restSeconds}
                                                        onChange={(e) =>
                                                            updateItem(selectedIndex, {
                                                                restSeconds: Number(e.target.value),
                                                            })
                                                        }
                                                        className="bg-secondary/50 border-border"
                                                    />
                                                    <p className="text-xs text-muted-foreground">
                                                        {formatRest(selected.restSeconds)}
                                                    </p>
                                                </div>
                                                <div className="flex flex-col gap-1.5 md:col-span-2">
                                                    <Label>Notas</Label>
                                                    <Input
                                                        value={selected.notes}
                                                        maxLength={500}
                                                        onChange={(e) =>
                                                            updateItem(selectedIndex, { notes: e.target.value })
                                                        }
                                                        placeholder="Observaciones"
                                                        className="bg-secondary/50 border-border"
                                                    />
                                                </div>
                                                <div className="flex flex-wrap gap-2 md:col-span-2">
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        onClick={() => moveItem(selectedIndex, -1)}
                                                        disabled={selectedIndex === 0}
                                                    >
                                                        <ArrowUp className="mr-1.5 h-4 w-4" />
                                                        Subir
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        onClick={() => moveItem(selectedIndex, 1)}
                                                        disabled={selectedIndex === items.length - 1}
                                                    >
                                                        <ArrowDown className="mr-1.5 h-4 w-4" />
                                                        Bajar
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        className="text-destructive"
                                                        onClick={() => removeItem(selectedIndex)}
                                                        disabled={items.length === 1}
                                                    >
                                                        <Trash2 className="mr-1.5 h-4 w-4" />
                                                        Eliminar
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {step === 2 && (
                            <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
                                <div className="rounded-lg border border-border bg-secondary/20 p-4">
                                    <h3 className="mb-2 font-semibold text-foreground">Revisión</h3>
                                    <p className="text-sm text-muted-foreground">{name || 'Sin nombre'}</p>
                                    <div className="mt-4 space-y-2">
                                        {items.map((item, index) => (
                                            <div key={index} className="rounded-md bg-card p-3 text-sm">
                                                <span className="font-medium text-foreground">
                                                    #{index + 1} {exerciseNameById.get(item.exerciseId) ?? 'Ejercicio'}
                                                </span>
                                                <span className="ml-2 text-muted-foreground">
                                                    {item.sets ?? '-'} x {item.reps || '-'} ·{' '}
                                                    {formatRest(item.restSeconds)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="rounded-lg border border-border bg-secondary/20 p-4">
                                    <div className="mb-3 flex items-center gap-2">
                                        <Paperclip className="h-4 w-4 text-muted-foreground" />
                                        <h3 className="font-semibold text-foreground">Archivos adjuntos</h3>
                                    </div>
                                    <Label
                                        htmlFor="routine-attachments"
                                        className="flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card p-5 text-center text-sm text-muted-foreground"
                                    >
                                        <FileUp className="mb-2 h-6 w-6" />
                                        Subir PDF, JPG, PNG o WEBP hasta 10 MiB
                                    </Label>
                                    <Input
                                        id="routine-attachments"
                                        type="file"
                                        multiple
                                        accept=".pdf,.jpg,.jpeg,.png,.webp"
                                        className="hidden"
                                        onChange={(e) => handleFiles(e.target.files)}
                                    />
                                    <div className="mt-3 space-y-2">
                                        {attachments.length === 0 ? (
                                            <p className="text-sm text-muted-foreground">Sin material agregado.</p>
                                        ) : (
                                            attachments.map((file) => (
                                                <div
                                                    key={file.id}
                                                    className="flex items-center justify-between gap-2 rounded-md bg-card p-2 text-sm"
                                                >
                                                    <button
                                                        type="button"
                                                        className="min-w-0 text-left text-primary underline-offset-4 hover:underline"
                                                        onClick={() => window.open(file.url, '_blank')}
                                                    >
                                                        <span className="block truncate">{file.name}</span>
                                                        <span className="text-xs text-muted-foreground">
                                                            {formatFileSize(file.size)}
                                                        </span>
                                                    </button>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() =>
                                                            setAttachments((prev) =>
                                                                prev.filter((a) => a.id !== file.id),
                                                            )
                                                        }
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <DialogFooter className="border-t border-border pt-4">
                        <Button type="button" variant="outline" onClick={() => handleClose(false)} disabled={isPending}>
                            Cancelar
                        </Button>
                        {step > 0 && (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setStep((s) => s - 1)}
                                disabled={isPending}
                            >
                                Anterior
                            </Button>
                        )}
                        {step < steps.length - 1 ? (
                            <Button type="button" onClick={nextStep} disabled={isPending}>
                                Siguiente
                            </Button>
                        ) : (
                            <Button type="submit" disabled={isPending}>
                                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isEditing ? 'Guardar cambios' : 'Crear rutina'}
                            </Button>
                        )}
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
