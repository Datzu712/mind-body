export type RoutineStatus = 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'FINISHED' | 'ARCHIVED';

export interface RoutineExerciseItemDto {
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

export interface RoutineDetailDto {
    id: string;
    name: string;
    objective: string | null;
    status: RoutineStatus;
    /** Dueño: fullName de quien creó la rutina (trainer o staff); null en datos legacy/seed. */
    createdByName: string | null;
    createdAt: string;
    updatedAt: string;
    exercises: RoutineExerciseItemDto[];
    /** Solo en `GET /routines/mine`: la que el home del miembro muestra. */
    focused?: boolean;
}

export interface RoutineSummaryDto {
    id: string;
    name: string;
    objective: string | null;
    status: RoutineStatus;
    createdByName: string | null;
    exerciseCount: number;
    updatedAt: string;
}
