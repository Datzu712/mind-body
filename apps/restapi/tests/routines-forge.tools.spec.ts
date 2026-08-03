import { describe, expect, it, vi } from 'vitest';

import { buildRoutineTools } from '../src/modules/routines/routines-forge.tools';
import type { RoutinesService } from '../src/modules/routines/routines.service';
import type { RoutineDetailDto } from '../src/modules/routines/routine.types';

const routineId = '0198c0de-0000-7000-8000-000000000001';
const exerciseId = '0198c0de-0000-7000-8000-000000000002';

const draft = (exercises: RoutineDetailDto['exercises'] = []): RoutineDetailDto => ({
    id: routineId,
    name: 'Nueva rutina',
    objective: null,
    status: 'DRAFT',
    createdByName: 'Trainer',
    createdAt: '2026-08-02T00:00:00Z',
    updatedAt: '2026-08-02T01:00:00Z',
    exercises,
});

type ExecutableTool = {
    execute?: (input: never, options: { toolCallId: string; messages: never[] }) => Promise<unknown> | unknown;
};

async function execute(tools: object, name: string, input: unknown): Promise<unknown> {
    const selected = (tools as Record<string, ExecutableTool>)[name];
    if (!selected?.execute) throw new Error(`Tool ${name} no disponible`);
    return selected.execute(input as never, { toolCallId: 'test-call', messages: [] });
}

function routinesMock(current: RoutineDetailDto = draft()) {
    return {
        detail: vi.fn().mockResolvedValue(current),
        replaceDraftPlan: vi.fn().mockResolvedValue(current),
        addExercises: vi.fn().mockResolvedValue(current),
        addExercise: vi.fn().mockResolvedValue(current),
    };
}

const errorAsData = (_tool: string, error: unknown) => ({
    error: error instanceof Error ? error.message : String(error),
});

describe('Forge routine tools', () => {
    it('en modo solo lectura no monta ninguna tool de escritura', () => {
        const tools = buildRoutineTools(routinesMock() as unknown as RoutinesService, routineId, vi.fn(), errorAsData, {
            readOnly: true,
        });

        expect(Object.keys(tools)).toEqual(['getDraft']);
    });

    it('solo expone reemplazo y vaciado cuando el turno los autorizó', () => {
        const base = [routinesMock() as unknown as RoutinesService, routineId, vi.fn(), errorAsData] as const;

        expect(Object.keys(buildRoutineTools(...base, { readOnly: false, allowPlanReplacement: false }))).not.toContain(
            'applyRoutinePlan',
        );
        expect(
            Object.keys(
                buildRoutineTools(...base, {
                    readOnly: false,
                    allowPlanReplacement: true,
                    allowClearRoutine: true,
                }),
            ),
        ).toEqual(expect.arrayContaining(['applyRoutinePlan', 'clearRoutine']));
    });

    it('rechaza IDs que no fueron observados en el borrador o searchExercises', async () => {
        const routines = routinesMock();
        const tools = buildRoutineTools(routines as unknown as RoutinesService, routineId, vi.fn(), errorAsData, {
            readOnly: false,
            allowPlanReplacement: true,
            observedExerciseIds: new Set(),
        });

        const result = await execute(tools, 'applyRoutinePlan', {
            name: 'Espalda',
            focus: 'espalda',
            goal: 'hipertrofia',
            level: 'intermediate',
            items: [{ exerciseId, sets: 3, reps: '8-12' }],
        });

        expect(result).toMatchObject({ error: expect.stringContaining('no observó') });
        expect(routines.replaceDraftPlan).not.toHaveBeenCalled();
    });

    it('aplica el plan completo con revisión esperada y notifica después del commit', async () => {
        const current = draft();
        const applied = draft([
            {
                id: '0198c0de-0000-7000-8000-000000000003',
                exerciseId,
                displayOrder: 1,
                sets: 3,
                reps: '8-12',
                notes: null,
                exercise: {
                    name: 'cable lat pulldown',
                    bodyPart: 'back',
                    equipment: 'cable',
                    target: 'lats',
                    gifUrl: null,
                    imageUrl: null,
                },
            },
        ]);
        const routines = routinesMock(current);
        routines.replaceDraftPlan.mockResolvedValue(applied);
        const onWrite = vi.fn();
        const tools = buildRoutineTools(routines as unknown as RoutinesService, routineId, onWrite, errorAsData, {
            readOnly: false,
            allowPlanReplacement: true,
            observedExerciseIds: new Set([exerciseId]),
        });

        const result = await execute(tools, 'applyRoutinePlan', {
            name: 'Espalda',
            focus: 'espalda',
            goal: 'hipertrofia',
            level: 'intermediate',
            items: [{ exerciseId, sets: 3, reps: '8-12' }],
        });

        expect(routines.replaceDraftPlan).toHaveBeenCalledWith(routineId, {
            name: 'Espalda',
            objective: 'hipertrofia · espalda · nivel intermedio',
            expectedUpdatedAt: current.updatedAt,
            items: [{ exerciseId, sets: 3, reps: '8-12' }],
        });
        expect(onWrite).toHaveBeenCalledOnce();
        expect(result).toMatchObject({ exercises: [{ exerciseId, sets: 3, reps: '8-12' }] });
    });

    it('rechaza duplicados al extender una rutina', async () => {
        const routines = routinesMock();
        const tools = buildRoutineTools(routines as unknown as RoutinesService, routineId, vi.fn(), errorAsData, {
            readOnly: false,
            observedExerciseIds: new Set([exerciseId]),
        });

        const result = await execute(tools, 'addExercises', {
            items: [
                { exerciseId, sets: 3, reps: '8-12' },
                { exerciseId, sets: 3, reps: '10-12' },
            ],
        });

        expect(result).toMatchObject({ error: expect.stringContaining('repite el mismo exerciseId') });
        expect(routines.addExercises).not.toHaveBeenCalled();
    });
});
