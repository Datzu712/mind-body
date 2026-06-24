export type ExerciseStatus = 'ACTIVE' | 'INACTIVE';

export interface Exercise {
    id: string;
    name: string;
    muscleGroup?: string;
    description?: string;
    status: ExerciseStatus;
}

export interface RoutineExercise {
    id: string;
    exerciseId: string;
    displayOrder: number;
    sets?: number;
    reps?: string;
    notes?: string;
}

export type RoutineStatus = 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'FINISHED' | 'ARCHIVED';

export interface Attachment {
    id: string;
    name: string;
    size: number;
    type: string;
    url: string;
}

export interface RoutineVersion {
    id: string;
    createdAt: string;
    note: string;
    exercises: RoutineExercise[];
}

export interface Routine {
    id: string;
    trainerId?: string;
    name: string;
    objective?: string;
    status: RoutineStatus;
    exercises: RoutineExercise[];
    attachments: Attachment[];
    versions: RoutineVersion[];
    createdAt: string;
    updatedAt: string;
}

export interface Member {
    id: string;
    name: string;
}

export type ClassMember = Member;

export interface MemberRoutine {
    id: string;
    memberId: string;
    routineId: string;
    assignedByTrainerId?: string;
    assignedAt: string;
    endedAt?: string;
    status: 'ACTIVE' | 'INACTIVE';
}

export interface GroupClass {
    id: string;
    name: string;
    time: string;
    capacity: number;
    duration: string;
    date: string;
}

export interface ClassAttendance {
    id: string;
    classId: string;
    className: string;
    date: string;
    memberId: string;
    memberName: string;
    attended: boolean;
    registeredAt?: string;
}
