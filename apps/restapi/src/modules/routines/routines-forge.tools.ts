import { BadRequestException } from '@nestjs/common';
import { tool } from 'ai';
import { z } from 'zod';

import type { RoutinesService } from './routines.service';
import type { RoutineDetailDto } from './routine.types';

/** Versión compacta del borrador para prompt y tool results (sin URLs ni timestamps). */
export function slimRoutineDraft(d: RoutineDetailDto) {
    return {
        name: d.name,
        objective: d.objective,
        status: d.status,
        revision: d.updatedAt,
        exercises: d.exercises.map((e) => ({
            itemId: e.id,
            exerciseId: e.exerciseId,
            order: e.displayOrder,
            name: e.exercise.name,
            bodyPart: e.exercise.bodyPart,
            target: e.exercise.target,
            equipment: e.exercise.equipment,
            sets: e.sets,
            reps: e.reps,
            notes: e.notes,
        })),
    };
}

interface RoutineToolsOptions {
    /** true cuando la rutina NO está en DRAFT: solo se montan tools de lectura. */
    readOnly: boolean;
    /** IDs vistos en el borrador o devueltos por searchExercises este turno. */
    observedExerciseIds?: ReadonlySet<string>;
    allowPlanReplacement?: boolean;
    allowClearRoutine?: boolean;
}

/**
 * Tools de Forge sobre la rutina. Regla de producto: Forge SOLO modifica
 * rutinas en DRAFT.
 *
 * Se aplica en dos capas: si la rutina no es borrador las
 * tools de escritura ni se montan (readOnly), y aunque estuvieran montadas,
 * toda escritura re-valida el estado antes de ejecutar (assertDraft) por si
 * cambió a mitad de turno (p. ej. publicada desde otra pestaña).
 */
export function buildRoutineTools(
    routines: RoutinesService,
    routineId: string,
    onWrite: () => void,
    onError: (toolName: string, err: unknown) => { error: string },
    { readOnly, observedExerciseIds, allowPlanReplacement = false, allowClearRoutine = false }: RoutineToolsOptions,
) {
    const readTools = {
        getDraft: tool({
            description:
                'Get the current state of the routine (source of truth). Returns every exercise ' +
                'with its itemId. Use it before editing if you are unsure about the current state.',
            inputSchema: z.object({}),
            execute: async () => {
                try {
                    return slimRoutineDraft(await routines.detail(routineId));
                } catch (err) {
                    return onError('getDraft', err);
                }
            },
        }),
    };

    if (readOnly) return readTools;

    const assertDraft = async () => {
        const d = await routines.detail(routineId);
        if (d.status !== 'DRAFT') {
            throw new BadRequestException(
                'La rutina ya no está en borrador: Forge solo puede modificar rutinas en DRAFT',
            );
        }
        return d;
    };

    const assertExercisesAreNew = async (exerciseIds: string[]) => {
        const unseen = observedExerciseIds ? exerciseIds.filter((id) => !observedExerciseIds.has(id)) : [];
        if (unseen.length > 0) {
            throw new BadRequestException(
                'Hay exerciseIds que no aparecieron en el borrador ni en searchExercises durante este turno',
            );
        }
        if (new Set(exerciseIds).size !== exerciseIds.length) {
            throw new BadRequestException('El plan repite el mismo exerciseId; cada ejercicio debe aparecer una vez');
        }
        const current = await routines.detail(routineId);
        const existingIds = new Set(current.exercises.map((item) => item.exerciseId));
        const repeated = exerciseIds.filter((id) => existingIds.has(id));
        if (repeated.length > 0) {
            throw new BadRequestException(
                'Algún ejercicio ya está en la rutina; edita su itemId o elige un ejercicio complementario',
            );
        }
    };

    /** Patrón común de escritura: validar DRAFT → ejecutar → notificar → borrador slim. */
    const write = async (toolName: string, fn: (current: RoutineDetailDto) => Promise<RoutineDetailDto>) => {
        try {
            const current = await assertDraft();
            const d = await fn(current);
            onWrite();
            return slimRoutineDraft(d);
        } catch (err) {
            return onError(toolName, err);
        }
    };

    const plannedExerciseSchema = z.object({
        exerciseId: z.string().describe('Catalog exercise id observed in searchExercises'),
        sets: z.number().int().min(1).max(20),
        reps: z.string().min(1).max(40).describe('e.g. "6-10" or "12-15"'),
        notes: z.string().max(500).optional().describe('Short actionable trainer note, in Spanish'),
    });
    const levelLabels = {
        beginner: 'principiante',
        intermediate: 'intermedio',
        advanced: 'avanzado',
    } as const;

    const applyRoutinePlan = tool({
        description:
            'Atomically apply a COMPLETE routine plan: replace every current exercise and update name/objective ' +
            'in one transaction. Use after catalog research when creating an empty routine or when the trainer ' +
            'explicitly asked to rebuild/replace the whole routine. Never use for a review or a partial edit. ' +
            'Every exerciseId must have been observed in searchExercises and may appear only once.',
        inputSchema: z.object({
            name: z.string().min(1).max(120),
            focus: z.string().min(1).max(120).describe('Session focus, in Spanish; e.g. "espalda y bíceps"'),
            goal: z.string().min(1).max(120).describe('Training goal, in Spanish; e.g. "hipertrofia"'),
            level: z.enum(['beginner', 'intermediate', 'advanced']),
            objectiveDetails: z
                .string()
                .max(1600)
                .optional()
                .describe('Only material constraints or programming details not captured by focus/goal/level'),
            items: z.array(plannedExerciseSchema).min(1).max(15),
        }),
        execute: async ({ name, focus, goal, level, objectiveDetails, items }) =>
            write('applyRoutinePlan', async (current) => {
                const exerciseIds = items.map((item) => item.exerciseId);
                const unseen = observedExerciseIds ? exerciseIds.filter((id) => !observedExerciseIds.has(id)) : [];
                if (unseen.length > 0) {
                    throw new BadRequestException(
                        'El plan usa exerciseIds que Forge no observó en searchExercises ni en el borrador',
                    );
                }
                const objective = `${goal.trim()} · ${focus.trim()} · nivel ${levelLabels[level]}${
                    objectiveDetails?.trim() ? ` · ${objectiveDetails.trim()}` : ''
                }`;
                return routines.replaceDraftPlan(routineId, {
                    name,
                    objective,
                    expectedUpdatedAt: current.updatedAt,
                    items: items.map((item) => ({
                        exerciseId: item.exerciseId,
                        sets: item.sets,
                        reps: item.reps,
                        ...(item.notes !== undefined && { notes: item.notes }),
                    })),
                });
            }),
    });

    const clearRoutine = tool({
        description:
            'Remove ALL exercises from the routine at once. Use only when the trainer asks to leave it empty. ' +
            'For a full rebuild use applyRoutinePlan, which replaces the plan atomically.',
        inputSchema: z.object({}),
        execute: async () => write('clearRoutine', async () => routines.removeAllExercises(routineId)),
    });

    return {
        ...readTools,
        ...(allowPlanReplacement && { applyRoutinePlan }),
        setRoutineInfo: tool({
            description: "Update the routine's name and/or objective.",
            inputSchema: z.object({
                name: z.string().max(120).optional(),
                objective: z.string().max(2000).optional(),
            }),
            execute: async ({ name, objective }) =>
                write('setRoutineInfo', async () =>
                    routines.update(routineId, {
                        ...(name !== undefined && { name }),
                        ...(objective !== undefined && { objective }),
                    }),
                ),
        }),
        addExercises: tool({
            description:
                'Add SEVERAL catalog exercises to the routine in ONE atomic call (preferred when ' +
                'building or extending a routine). Items are appended in the given order. ' +
                'exerciseIds MUST come from searchExercises; sets and reps are required so Forge never ' +
                'adds an exercise without a usable prescription.',
            inputSchema: z.object({
                items: z.array(plannedExerciseSchema).min(1).max(15),
            }),
            execute: async ({ items }) =>
                write('addExercises', async () => {
                    await assertExercisesAreNew(items.map((item) => item.exerciseId));
                    return routines.addExercises(
                        routineId,
                        items.map((i) => ({
                            exerciseId: i.exerciseId,
                            sets: i.sets,
                            reps: i.reps,
                            ...(i.notes !== undefined && { notes: i.notes }),
                        })),
                    );
                }),
        }),
        addExercise: tool({
            description:
                'Add ONE exercise from the catalog to the routine (appended at the end). For multiple ' +
                'exercises use addExercises instead. sets and reps are required.',
            inputSchema: plannedExerciseSchema,
            execute: async ({ exerciseId, sets, reps, notes }) =>
                write('addExercise', async () => {
                    await assertExercisesAreNew([exerciseId]);
                    return routines.addExercise(routineId, {
                        exerciseId,
                        sets,
                        reps,
                        ...(notes !== undefined && { notes }),
                    });
                }),
        }),
        updateExercise: tool({
            description:
                'Update sets/reps/notes of one routine item by its itemId (from the draft). ' +
                'Pass null to clear a field.',
            inputSchema: z.object({
                itemId: z.string(),
                sets: z.number().int().min(1).max(20).nullable().optional(),
                reps: z.string().max(40).nullable().optional(),
                notes: z.string().max(500).nullable().optional(),
            }),
            execute: async ({ itemId, sets, reps, notes }) =>
                write('updateExercise', async () =>
                    routines.updateExercise(routineId, itemId, {
                        ...(sets !== undefined && { sets }),
                        ...(reps !== undefined && { reps }),
                        ...(notes !== undefined && { notes }),
                    }),
                ),
        }),
        removeExercise: tool({
            description: 'Remove one exercise from the routine by its itemId.',
            inputSchema: z.object({ itemId: z.string() }),
            execute: async ({ itemId }) =>
                write('removeExercise', async () => routines.removeExercise(routineId, itemId)),
        }),
        ...(allowClearRoutine && { clearRoutine }),
        reorderExercises: tool({
            description: 'Reorder the routine: pass the COMPLETE list of itemIds in the new order.',
            inputSchema: z.object({ itemIds: z.array(z.string()).min(1) }),
            execute: async ({ itemIds }) =>
                write('reorderExercises', async () => routines.reorderExercises(routineId, itemIds)),
        }),
    };
}
