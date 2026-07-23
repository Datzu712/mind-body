export type TrainingSessionStatus = 'PENDING' | 'CONFIRMED' | 'VALIDATED' | 'EXPIRED';

export interface RoutineExercise {
    id: string;
    routineId: string;
    exerciseId: string;
    displayOrder: number;
    sets: number | null;
    reps: string | null;
    restSeconds: number;
    notes: string | null;
    exerciseName?: string;
}

export interface Routine {
    id: string;
    name: string;
    objective: string | null;
    status: string;
    memberRoutineId: string;
    exercises: RoutineExercise[];
}

export interface ExerciseLog {
    id: string;
    sessionId: string;
    routineExerciseId: string;
    targetSets: number | null;
    targetReps: string | null;
    targetWeightKg: number | null;
    completedSets: number | null;
    completedRepsLog: string | null;
    weightKgActual: number | null;
    notes: string | null;
    completed: boolean;
    createdAt: string;
    exerciseName?: string;
}

export interface TrainingSession {
    id: string;
    memberRoutineId: string;
    date: string;
    status: TrainingSessionStatus;
    confirmedAt: string | null;
    confirmedBy: string | null;
    validatedByTrainerId: string | null;
    validatedAt: string | null;
    notes: string | null;
    createdAt: string;
    exerciseLogs?: ExerciseLog[];
}

export type NotificationType = 'ROUTINE_ASSIGNED' | 'ROUTINE_UPDATED' | 'SESSION_VALIDATED';

export interface Notification {
    id: string;
    userId: string;
    type: NotificationType;
    title: string;
    body: string | null;
    payload: Record<string, unknown> | null;
    read: boolean;
    createdAt: string;
}

export interface CreateExerciseLogPayload {
    routineExerciseId: string;
    completedSets?: number;
    completedRepsLog?: string;
    weightKgActual?: number;
    notes?: string;
    completed?: boolean;
}
