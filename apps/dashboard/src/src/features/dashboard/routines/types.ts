export interface Exercise {
    id: string;
    name: string;
    muscleGroup?: string | null;
    equipment?: string | null;
    instructions?: string | null;
}

export interface RoutineExercise {
    id: string;
    routineId: string;
    exerciseId: string;
    displayOrder: number;
    sets: number | null;
    reps: string | null;
    notes?: string | null;
    exerciseName?: string | null;
    exercise?: Exercise;
}

export type RoutineStatus = 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'FINISHED' | 'ARCHIVED';

export interface Routine {
    id: string;
    trainerId: string;
    name: string;
    objective?: string | null;
    status: RoutineStatus;
    createdAt: string;
    updatedAt: string;
    exercises: RoutineExercise[];
}

export interface RoutineMember {
    id: string;
    memberId: string;
    fullName: string;
    email: string | null;
    status: string;
    assignedAt: string;
}

export type SessionStatus = 'PENDING' | 'CONFIRMED' | 'VALIDATED' | 'EXPIRED';

export interface TrainingSession {
    id: string;
    memberRoutineId: string;
    date: string;
    status: SessionStatus;
    confirmedAt?: string | null;
    confirmedBy?: string | null;
    validatedByTrainerId?: string | null;
    validatedAt?: string | null;
    notes?: string | null;
    createdAt: string;
    member?: { id: string; fullName: string };
}

export interface RoutineVersion {
    id: string;
    routineId: string;
    versionNumber: number;
    snapshot: unknown;
    changedBy: string;
    changeReason?: string | null;
    createdAt: string;
}

export interface RoutineFormExercise {
    exerciseId: string;
    displayOrder: number;
    sets: number | null;
    reps: string | null;
    notes?: string;
}

export interface RoutineFormData {
    name: string;
    objective?: string;
    exercises: RoutineFormExercise[];
    changeReason?: string;
}
