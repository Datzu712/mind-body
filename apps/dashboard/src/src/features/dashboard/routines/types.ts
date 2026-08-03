export type RoutineStatus = 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'FINISHED' | 'ARCHIVED';

export interface RoutineExerciseItem {
    /** Id de la fila routine_exercises (itemId para editar/quitar/reordenar). */
    id: string;
    exerciseId: string;
    displayOrder: number;
    sets: number | null;
    reps: string | null;
    notes: string | null;
    exercise: {
        name: string;
        bodyPart: string | null;
        equipment: string | null;
        target: string | null;
        gifUrl: string | null;
        imageUrl: string | null;
    };
}

export interface RoutineDetail {
    id: string;
    name: string;
    objective: string | null;
    status: RoutineStatus;
    createdByName: string | null;
    createdAt: string;
    updatedAt: string;
    exercises: RoutineExerciseItem[];
}

export interface RoutineSummary {
    id: string;
    name: string;
    objective: string | null;
    status: RoutineStatus;
    createdByName: string | null;
    exerciseCount: number;
    updatedAt: string;
}

export interface RoutinesFilters {
    q?: string;
    status?: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
}
