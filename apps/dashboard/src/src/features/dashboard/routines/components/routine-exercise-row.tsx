import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { ArrowDown, ArrowUp, X } from 'lucide-react';
import { ExerciseCard } from '@/src/features/dashboard/exercises/components/exercise-card';
import type { ExerciseSlim } from '@/src/features/dashboard/exercises/types';
import type { RoutineExerciseItem } from '../types';

interface RoutineExerciseRowProps {
    item: RoutineExerciseItem;
    index: number;
    total: number;
    disabled: boolean;
    onPatch: (itemId: string, patch: { sets?: number | null; reps?: string | null; notes?: string | null }) => void;
    onMove: (itemId: string, direction: -1 | 1) => void;
    onRemove: (itemId: string) => void;
    /** Abre el detalle del ejercicio (GIF + instrucciones) al hacer click en la card. */
    onShowDetail: (exerciseId: string) => void;
}

/** ExerciseCard espera un ExerciseSlim; se reconstruye desde el ítem de rutina. */
function toSlim(item: RoutineExerciseItem): ExerciseSlim {
    return {
        id: item.exerciseId,
        name: item.exercise.name,
        bodyPart: item.exercise.bodyPart,
        equipment: item.exercise.equipment,
        target: item.exercise.target,
        muscleGroup: null,
        imageUrl: item.exercise.imageUrl,
        gifUrl: item.exercise.gifUrl,
    };
}

export function RoutineExerciseRow({
    item,
    index,
    total,
    disabled,
    onPatch,
    onMove,
    onRemove,
    onShowDetail,
}: RoutineExerciseRowProps) {
    // Flash de confirmación cuando sets/reps/notas cambian desde el server
    // (guardado propio o edición de Forge): señala QUÉ fila cambió.
    const signature = `${item.sets ?? ''}|${item.reps ?? ''}|${item.notes ?? ''}`;
    const prevSignature = useRef(signature);
    const [flash, setFlash] = useState(false);
    useEffect(() => {
        if (prevSignature.current === signature) return;
        prevSignature.current = signature;
        setFlash(true);
        const t = setTimeout(() => setFlash(false), 900);
        return () => clearTimeout(t);
    }, [signature]);

    return (
        <div
            className={cn(
                'rounded-lg border bg-card p-3 transition-colors duration-500',
                flash ? 'border-primary/60 bg-primary/10' : 'border-border',
            )}
        >
            <div className="flex items-start gap-2">
                <div className="flex flex-col">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        disabled={disabled || index === 0}
                        onClick={() => onMove(item.id, -1)}
                        aria-label="Subir"
                    >
                        <ArrowUp className="h-3.5 w-3.5" />
                    </Button>
                    <span className="text-center text-xs font-medium text-muted-foreground">{index + 1}</span>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        disabled={disabled || index === total - 1}
                        onClick={() => onMove(item.id, 1)}
                        aria-label="Bajar"
                    >
                        <ArrowDown className="h-3.5 w-3.5" />
                    </Button>
                </div>

                <div className="min-w-0 flex-1">
                    <ExerciseCard exercise={toSlim(item)} variant="row" onClick={() => onShowDetail(item.exerciseId)} />

                    {/* key con los valores del server: si Forge los cambia, los inputs se remontan */}
                    <div
                        key={`${item.id}-${item.sets ?? ''}-${item.reps ?? ''}-${item.notes ?? ''}`}
                        className="mt-2 grid grid-cols-[90px_110px_1fr] gap-2"
                    >
                        <Input
                            type="number"
                            min={1}
                            max={20}
                            placeholder="Sets"
                            defaultValue={item.sets ?? ''}
                            disabled={disabled}
                            onBlur={(e) => {
                                const v = e.target.value === '' ? null : Number(e.target.value);
                                if (v !== item.sets) onPatch(item.id, { sets: v });
                            }}
                        />
                        <Input
                            placeholder="Reps (8-12)"
                            maxLength={40}
                            defaultValue={item.reps ?? ''}
                            disabled={disabled}
                            onBlur={(e) => {
                                const v = e.target.value.trim() || null;
                                if (v !== item.reps) onPatch(item.id, { reps: v });
                            }}
                        />
                        <Input
                            placeholder="Nota para el miembro"
                            maxLength={500}
                            defaultValue={item.notes ?? ''}
                            disabled={disabled}
                            onBlur={(e) => {
                                const v = e.target.value.trim() || null;
                                if (v !== item.notes) onPatch(item.id, { notes: v });
                            }}
                        />
                    </div>
                </div>

                <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    disabled={disabled}
                    onClick={() => onRemove(item.id)}
                    aria-label="Quitar ejercicio"
                >
                    <X className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
