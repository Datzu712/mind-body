import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { sileo } from 'sileo';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { ClipboardList, Loader2, Rocket, UserPlus } from 'lucide-react';
import type { RoutineDetail, RoutineStatus } from '../types';
import {
    useAssignedMembers,
    useRemoveExerciseItem,
    useReorderExercises,
    useUpdateExerciseItem,
    useUpdateRoutine,
} from '../hooks';
import { RoutineExerciseRow } from './routine-exercise-row';
import { AssignRoutineDialog } from './assign-routine-dialog';

const statusLabels: Record<RoutineStatus, string> = {
    DRAFT: 'Borrador',
    ACTIVE: 'Activa',
    PAUSED: 'Pausada',
    FINISHED: 'Finalizada',
    ARCHIVED: 'Archivada',
};

interface RoutineEditorProps {
    routine: RoutineDetail;
    /** true mientras Forge está editando (lock de UI). */
    disabled: boolean;
    /** Abre el detalle del ejercicio (GIF + instrucciones). */
    onShowDetail: (exerciseId: string) => void;
}

export function RoutineEditor({ routine, disabled, onShowDetail }: RoutineEditorProps) {
    const updateRoutine = useUpdateRoutine(routine.id);
    const updateItem = useUpdateExerciseItem(routine.id);
    const removeItem = useRemoveExerciseItem(routine.id);
    const reorder = useReorderExercises(routine.id);
    const [assignOpen, setAssignOpen] = useState(false);
    const { data: assignedMembers = [] } = useAssignedMembers(routine.id);

    // Al agregar (manual o de Forge) el ejercicio entra al FINAL: se
    // scrollea hacia él para que el pop de entrada no ocurra fuera de vista.
    const listRef = useRef<HTMLDivElement>(null);
    const prevCount = useRef(routine.exercises.length);
    useEffect(() => {
        const count = routine.exercises.length;
        if (count > prevCount.current) {
            requestAnimationFrame(() => {
                listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
            });
        }
        prevCount.current = count;
    }, [routine.exercises.length]);

    const toastError = (title: string) => (e: Error) => sileo.error({ title, description: e.message });

    const handlePublish = () => {
        updateRoutine
            .mutateAsync({ status: 'ACTIVE' })
            .then(() => sileo.success({ title: 'Rutina publicada', description: 'Ya se puede asignar a miembros.' }))
            .catch(toastError('No se pudo publicar'));
    };

    const handleMove = (itemId: string, direction: -1 | 1) => {
        const ids = routine.exercises.map((e) => e.id);
        const from = ids.indexOf(itemId);
        const to = from + direction;
        if (from < 0 || to < 0 || to >= ids.length) return;
        const next = [...ids];
        next.splice(from, 1);
        next.splice(to, 0, itemId);
        reorder.mutateAsync(next).catch(toastError('No se pudo reordenar'));
    };

    return (
        <div className="flex h-full flex-col gap-4">
            <div className="rounded-lg border border-border bg-card p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                    <Badge variant={routine.status === 'ACTIVE' ? 'default' : 'secondary'}>
                        {statusLabels[routine.status]}
                    </Badge>
                    <div className="flex items-center gap-2">
                        {routine.status === 'DRAFT' && (
                            <Button
                                size="sm"
                                onClick={handlePublish}
                                disabled={disabled || updateRoutine.isPending || routine.exercises.length === 0}
                            >
                                {updateRoutine.isPending ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Rocket className="h-4 w-4" />
                                )}
                                Publicar
                            </Button>
                        )}
                        {routine.status === 'ACTIVE' && (
                            <Button size="sm" variant="outline" onClick={() => setAssignOpen(true)} disabled={disabled}>
                                <UserPlus className="h-4 w-4" /> Asignar
                            </Button>
                        )}
                    </div>
                </div>

                {/* key con los valores del server: remonta si Forge renombra */}
                <div key={`${routine.name}::${routine.objective ?? ''}`} className="space-y-2">
                    <Input
                        defaultValue={routine.name}
                        maxLength={120}
                        disabled={disabled}
                        className="border-transparent bg-transparent px-1 text-lg font-semibold focus-visible:border-border"
                        onBlur={(e) => {
                            const v = e.target.value.trim();
                            if (v && v !== routine.name) {
                                updateRoutine.mutateAsync({ name: v }).catch(toastError('No se pudo renombrar'));
                            }
                        }}
                    />
                    <Textarea
                        defaultValue={routine.objective ?? ''}
                        placeholder="Objetivo de la rutina (ej: hipertrofia de espalda, 3 días/semana)"
                        maxLength={2000}
                        rows={2}
                        disabled={disabled}
                        className="resize-none border-transparent bg-transparent px-1 text-sm focus-visible:border-border"
                        onBlur={(e) => {
                            const v = e.target.value.trim() || null;
                            if (v !== routine.objective) {
                                updateRoutine.mutateAsync({ objective: v }).catch(toastError('No se pudo guardar'));
                            }
                        }}
                    />
                </div>

                {/* Confirmación que queda: antes el único rastro de un assign era un
                    toast que se desvanecía, y nada en pantalla cambiaba. */}
                {routine.status === 'ACTIVE' && assignedMembers.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <span className="text-xs text-muted-foreground">Asignada a {assignedMembers.length}:</span>
                        {assignedMembers.map((member) => (
                            <Badge key={member.memberId} variant="secondary" className="gap-1 font-normal">
                                <UserPlus className="h-3 w-3" />
                                {member.fullName}
                            </Badge>
                        ))}
                    </div>
                )}
            </div>

            <div ref={listRef} className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
                {routine.exercises.length === 0 ? (
                    <Empty className="border border-dashed border-border">
                        <EmptyHeader>
                            <EmptyMedia variant="icon">
                                <ClipboardList />
                            </EmptyMedia>
                            <EmptyTitle>Rutina vacía</EmptyTitle>
                            <EmptyDescription>
                                Agregá ejercicios con el botón «+» de la biblioteca, o pedíselo a Forge.
                            </EmptyDescription>
                        </EmptyHeader>
                    </Empty>
                ) : (
                    // layout => FLIP: el reorden (flechas o Forge) se anima como
                    // intercambio fluido; popLayout saca al eliminado del flujo para
                    // que el resto se deslice a su lugar mientras él se desvanece.
                    <AnimatePresence initial={false} mode="popLayout">
                        {routine.exercises.map((item, index) => (
                            <motion.div
                                key={item.id}
                                layout
                                initial={{ opacity: 0, scale: 0.85, y: 12 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.92, x: -32 }}
                                transition={{ type: 'spring', stiffness: 480, damping: 34, mass: 0.75 }}
                            >
                                <RoutineExerciseRow
                                    item={item}
                                    index={index}
                                    total={routine.exercises.length}
                                    disabled={disabled}
                                    onPatch={(itemId, patch) => {
                                        updateItem
                                            .mutateAsync({ itemId, ...patch })
                                            .catch(toastError('No se pudo guardar'));
                                    }}
                                    onMove={handleMove}
                                    onRemove={(itemId) => {
                                        removeItem.mutateAsync(itemId).catch(toastError('No se pudo quitar'));
                                    }}
                                    onShowDetail={onShowDetail}
                                />
                            </motion.div>
                        ))}
                    </AnimatePresence>
                )}
            </div>

            <AssignRoutineDialog
                routineId={routine.id}
                routineName={routine.name}
                open={assignOpen}
                onOpenChange={setAssignOpen}
            />
        </div>
    );
}
