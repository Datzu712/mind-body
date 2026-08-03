import { describe, expect, it } from 'vitest';

import { createActivityTracker, deriveActivityKind } from '../src/modules/routines/routines-forge.activity';

describe('deriveActivityKind', () => {
    it('start-step deriva thinking', () => {
        expect(deriveActivityKind({ type: 'start-step' })).toBe('thinking');
    });

    it('text-delta deriva composing', () => {
        expect(deriveActivityKind({ type: 'text-delta' })).toBe('composing');
    });

    it.each([
        ['getExerciseFilters', 'searching'],
        ['searchExercises', 'searching'],
        ['getExerciseDetails', 'searching'],
        ['getDraft', 'reading'],
        ['setRoutineInfo', 'editing'],
        ['applyRoutinePlan', 'editing'],
        ['clearRoutine', 'editing'],
        ['addExercises', 'editing'],
        ['addExercise', 'editing'],
        ['updateExercise', 'editing'],
        ['removeExercise', 'editing'],
        ['reorderExercises', 'editing'],
    ] as const)('tool-call %s deriva %s', (toolName, kind) => {
        expect(deriveActivityKind({ type: 'tool-call', toolName })).toBe(kind);
    });

    it('tool desconocida no deriva nada (fase anterior persiste)', () => {
        expect(deriveActivityKind({ type: 'tool-call', toolName: 'unaToolFutura' })).toBeUndefined();
    });

    it('partes irrelevantes no derivan nada', () => {
        expect(deriveActivityKind({ type: 'finish' })).toBeUndefined();
        expect(deriveActivityKind({ type: 'tool-result' })).toBeUndefined();
        expect(deriveActivityKind({ type: 'finish-step' })).toBeUndefined();
    });
});

describe('createActivityTracker', () => {
    it('deduplica kinds consecutivos', () => {
        const next = createActivityTracker();
        expect(next({ type: 'tool-call', toolName: 'searchExercises' })).toBe('searching');
        expect(next({ type: 'tool-call', toolName: 'getExerciseDetails' })).toBeUndefined();
    });

    it('re-emite un kind cuando deja de ser consecutivo (escribe → edita → escribe)', () => {
        const next = createActivityTracker();
        expect(next({ type: 'text-delta' })).toBe('composing');
        expect(next({ type: 'tool-call', toolName: 'addExercise' })).toBe('editing');
        expect(next({ type: 'text-delta' })).toBe('composing');
    });

    it('secuencia del spec: start-step → tool-call → text-delta produce thinking → searching → composing', () => {
        const next = createActivityTracker();
        const parts = [
            { type: 'start-step' },
            { type: 'tool-call', toolName: 'searchExercises' },
            { type: 'text-delta' },
        ];
        expect(parts.map(next).filter(Boolean)).toEqual(['thinking', 'searching', 'composing']);
    });

    it('un turno con dos steps re-emite thinking al arrancar el segundo step', () => {
        const next = createActivityTracker();
        const parts = [
            { type: 'start-step' },
            { type: 'tool-call', toolName: 'searchExercises' },
            { type: 'tool-result' },
            { type: 'start-step' },
            { type: 'text-delta' },
            { type: 'text-delta' },
        ];
        expect(parts.map(next).filter(Boolean)).toEqual(['thinking', 'searching', 'thinking', 'composing']);
    });
});
