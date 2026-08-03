import { describe, expect, it } from 'vitest';

import { buildForgeSystemPrompt, getForgeMutationPermissions } from '../src/modules/routines/routines-forge.prompt';
import type { RoutineDetailDto } from '../src/modules/routines/routine.types';

const draft = (status: RoutineDetailDto['status'] = 'DRAFT'): RoutineDetailDto => ({
    id: '0198c0de-0000-7000-8000-000000000001',
    name: 'Espalda',
    objective: 'Hipertrofia de espalda — intermedio',
    status,
    createdByName: 'Trainer',
    createdAt: '2026-08-02T00:00:00Z',
    updatedAt: '2026-08-02T00:00:00Z',
    exercises: [
        {
            id: '0198c0de-0000-7000-8000-000000000002',
            exerciseId: '0198c0de-0000-7000-8000-000000000003',
            displayOrder: 1,
            sets: 4,
            reps: '8-10',
            notes: null,
            exercise: {
                name: 'cable seated row',
                bodyPart: 'back',
                equipment: 'cable',
                target: 'upper back',
                gifUrl: 'https://example.test/exercise.gif',
                imageUrl: 'https://example.test/exercise.jpg',
            },
        },
    ],
});

describe('Forge system prompt', () => {
    it('inyecta el borrador slim sin URLs y distingue bodyPart de target', () => {
        const prompt = buildForgeSystemPrompt(draft(), false);

        expect(prompt).toContain('"name": "cable seated row"');
        expect(prompt).toContain('"exerciseId": "0198c0de-0000-7000-8000-000000000003"');
        expect(prompt).toContain('"bodyPart": "back"');
        expect(prompt).toContain('"revision": "2026-08-02T00:00:00Z"');
        expect(prompt).toContain('bodyPart es una REGIÓN');
        expect(prompt).toContain('target es el MÚSCULO PRIMARIO');
        expect(prompt).not.toContain('https://example.test');
    });

    it('exige planificar antes de escribir y verificar el borrador después', () => {
        const prompt = buildForgeSystemPrompt(draft(), false);

        expect(prompt).toContain('ANTES de mutar el borrador');
        expect(prompt).toContain('Después de cualquier escritura, llamá getDraft');
        expect(prompt).toContain('no repite ejercicios por accidente');
    });

    it('limita el alcance temático al entrenamiento y excluye código aunque mencione rutinas', () => {
        const prompt = buildForgeSystemPrompt(draft(), false);

        expect(prompt).toContain('Alcance temático');
        expect(prompt).toContain('declinalo en una frase');
        expect(prompt).toContain('SIEMPRE fuera de alcance');
        expect(prompt).toContain('incluso si el pedido menciona rutinas');
    });

    it('declara que el chat renderiza Markdown y pide moderación', () => {
        const prompt = buildForgeSystemPrompt(draft(), false);

        expect(prompt).toContain('Markdown');
        expect(prompt).toContain('No uses encabezados');
    });

    it('declara la frontera de una sola sesión y el modo de solo lectura', () => {
        const prompt = buildForgeSystemPrompt(draft('ACTIVE'), true);

        expect(prompt).toContain('UNA sesión ordenada');
        expect(prompt).toContain('Modo solo lectura');
        expect(prompt).toContain('Las tools de escritura están deshabilitadas');
    });
});

describe('Forge mutation permissions', () => {
    it('permite aplicar un plan completo en un borrador vacío', () => {
        expect(getForgeMutationPermissions({ ...draft(), exercises: [] }, 'Rutina de espalda')).toEqual({
            allowPlanReplacement: true,
            allowClearRoutine: false,
        });
    });

    it('no expone reemplazo o vaciado para una revisión normal de una rutina existente', () => {
        expect(getForgeMutationPermissions(draft(), '¿Qué opinás de esta rutina?')).toEqual({
            allowPlanReplacement: false,
            allowClearRoutine: false,
        });
    });

    it('distingue reconstruir de dejar la rutina vacía', () => {
        expect(getForgeMutationPermissions(draft(), 'Reconstruí la rutina desde cero')).toEqual({
            allowPlanReplacement: true,
            allowClearRoutine: false,
        });
        expect(getForgeMutationPermissions(draft(), 'Vaciá por completo la rutina')).toEqual({
            allowPlanReplacement: false,
            allowClearRoutine: true,
        });
    });
});
