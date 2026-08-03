/**
 * Actividad "real" del turno de Forge para la UI: cada part del fullStream
 * se traduce a un kind semántico chico y estable. La presentación (estado
 * del orb, frases, cadencia) vive por completo en el dashboard.
 */
export type ForgeActivityKind = 'thinking' | 'searching' | 'reading' | 'editing' | 'composing';

/** Tools → kind. Una tool futura sin mapear simplemente no emite actividad. */
export const TOOL_ACTIVITY: Record<string, ForgeActivityKind> = {
    getExerciseFilters: 'searching',
    searchExercises: 'searching',
    getExerciseDetails: 'searching',
    getDraft: 'reading',
    setRoutineInfo: 'editing',
    applyRoutinePlan: 'editing',
    clearRoutine: 'editing',
    addExercises: 'editing',
    addExercise: 'editing',
    updateExercise: 'editing',
    removeExercise: 'editing',
    reorderExercises: 'editing',
};

/** Vista estructural mínima de una part del fullStream (evita acoplar el
 *  módulo al union gigante de `ai`; las parts reales calzan por estructura). */
export interface ActivityStreamPart {
    type: string;
    toolName?: string;
}

export function deriveActivityKind(part: ActivityStreamPart): ForgeActivityKind | undefined {
    if (part.type === 'start-step') return 'thinking';
    if (part.type === 'text-delta') return 'composing';
    if (part.type === 'tool-call' && part.toolName) return TOOL_ACTIVITY[part.toolName];
    return undefined;
}

/** Derivación + dedupe de consecutivos: devuelve el kind SOLO cuando cambia. */
export function createActivityTracker(): (part: ActivityStreamPart) => ForgeActivityKind | undefined {
    let last: ForgeActivityKind | undefined;
    return (part) => {
        const kind = deriveActivityKind(part);
        if (!kind || kind === last) return undefined;
        last = kind;
        return kind;
    };
}
