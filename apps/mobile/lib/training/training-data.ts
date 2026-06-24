export interface Exercise {
    id: string;
    name: string;
    muscleGroup: string;
    description: string;
    status: 'ACTIVE' | 'INACTIVE';
    category: 'fuerza' | 'cardio' | 'flexibilidad';
    emoji: string;
}

export interface RoutineExercise {
    id: string;
    exerciseId: string;
    displayOrder: number;
    sets: number;
    reps: string;
    notes?: string;
}

export interface Routine {
    id: string;
    trainerId?: string;
    name: string;
    objective?: string;
    status: 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'FINISHED' | 'ARCHIVED';
    exercises: RoutineExercise[];
    createdAt: string;
    updatedAt: string;
}

export interface MemberRoutine {
    id: string;
    memberId: string;
    routineId: string;
    assignedByTrainerId?: string;
    assignedAt: string;
    endedAt?: string;
    status: 'ACTIVE' | 'INACTIVE';
}

export interface WorkoutSessionExercise {
    routineExerciseId: string;
    sets: { weight?: number; reps?: number; done: boolean }[];
    notes?: string;
}

export interface WorkoutSession {
    id: string;
    memberRoutineId: string;
    date: string;
    exercises: WorkoutSessionExercise[];
    confirmedByMember: boolean;
    trainerSignature?: string;
    status: 'IN_PROGRESS' | 'COMPLETED' | 'MISSED';
}

export const MOCK_MEMBER_ID = 'member-1';

export const EXERCISES: Exercise[] = [
    {
        id: 'ex-001',
        name: 'Press de Banca',
        muscleGroup: 'Pecho',
        description: 'Press horizontal con barra para pectoral mayor y tríceps.',
        status: 'ACTIVE',
        category: 'fuerza',
        emoji: '🏋️',
    },
    {
        id: 'ex-002',
        name: 'Peso Muerto',
        muscleGroup: 'Espalda baja',
        description: 'Levantamiento desde el suelo para cadena posterior.',
        status: 'ACTIVE',
        category: 'fuerza',
        emoji: '⚡',
    },
    {
        id: 'ex-003',
        name: 'Sentadilla',
        muscleGroup: 'Cuádriceps',
        description: 'Sentadilla con barra para piernas y glúteos.',
        status: 'ACTIVE',
        category: 'fuerza',
        emoji: '🔥',
    },
    {
        id: 'ex-004',
        name: 'Press Militar',
        muscleGroup: 'Hombros',
        description: 'Press vertical de hombros con barra o mancuernas.',
        status: 'ACTIVE',
        category: 'fuerza',
        emoji: '💥',
    },
    {
        id: 'ex-005',
        name: 'Dominadas',
        muscleGroup: 'Espalda',
        description: 'Tracción en barra fija hasta que la barbilla supere la barra.',
        status: 'ACTIVE',
        category: 'fuerza',
        emoji: '🎯',
    },
    {
        id: 'ex-006',
        name: 'Fondos en Paralelas',
        muscleGroup: 'Tríceps',
        description: 'Fondos en barras paralelas enfocados en tríceps y pecho.',
        status: 'ACTIVE',
        category: 'fuerza',
        emoji: '✊',
    },
    {
        id: 'ex-007',
        name: 'Carrera HIIT',
        muscleGroup: 'Full Body',
        description: 'Intervalos de alta intensidad sobre cinta o al aire libre.',
        status: 'ACTIVE',
        category: 'cardio',
        emoji: '🏃',
    },
    {
        id: 'ex-008',
        name: 'Burpees',
        muscleGroup: 'Full Body',
        description: 'Combinación de sentadilla, plancha y salto vertical.',
        status: 'ACTIVE',
        category: 'cardio',
        emoji: '🔥',
    },
    {
        id: 'ex-009',
        name: 'Hip Flexor Stretch',
        muscleGroup: 'Caderas',
        description: 'Estiramiento pasivo de flexores de cadera.',
        status: 'ACTIVE',
        category: 'flexibilidad',
        emoji: '🧘',
    },
    {
        id: 'ex-010',
        name: 'Pigeon Pose',
        muscleGroup: 'Glúteos',
        description: 'Postura de yoga para glúteo e isquiotibiales.',
        status: 'ACTIVE',
        category: 'flexibilidad',
        emoji: '🕊️',
    },
];

export const ROUTINES: Routine[] = [
    {
        id: 'rt-001',
        trainerId: 'trainer-1',
        name: 'PECHO & TRÍCEPS',
        objective: 'Hipertrofia de push',
        status: 'ACTIVE',
        exercises: [
            {
                id: 're-001',
                exerciseId: 'ex-001',
                displayOrder: 1,
                sets: 4,
                reps: '10',
                notes: 'Última serie drop-set',
            },
            { id: 're-002', exerciseId: 'ex-006', displayOrder: 2, sets: 3, reps: '12' },
        ],
        createdAt: '2026-06-01T08:00:00.000Z',
        updatedAt: '2026-06-15T08:00:00.000Z',
    },
    {
        id: 'rt-002',
        trainerId: 'trainer-1',
        name: 'ESPALDA & BÍCEPS',
        objective: 'Fuerza de pull',
        status: 'ACTIVE',
        exercises: [
            { id: 're-003', exerciseId: 'ex-005', displayOrder: 1, sets: 4, reps: 'Máx.' },
            { id: 're-004', exerciseId: 'ex-002', displayOrder: 2, sets: 3, reps: '6' },
        ],
        createdAt: '2026-06-01T08:00:00.000Z',
        updatedAt: '2026-06-15T08:00:00.000Z',
    },
    {
        id: 'rt-003',
        trainerId: 'trainer-1',
        name: 'FULL BODY HIIT',
        objective: 'Condición física',
        status: 'ACTIVE',
        exercises: [
            { id: 're-005', exerciseId: 'ex-007', displayOrder: 1, sets: 8, reps: '30s' },
            { id: 're-006', exerciseId: 'ex-008', displayOrder: 2, sets: 4, reps: '20' },
            { id: 're-007', exerciseId: 'ex-009', displayOrder: 3, sets: 2, reps: '60s' },
        ],
        createdAt: '2026-06-01T08:00:00.000Z',
        updatedAt: '2026-06-15T08:00:00.000Z',
    },
];

export const MEMBER_ROUTINES: MemberRoutine[] = [
    {
        id: 'mr-001',
        memberId: MOCK_MEMBER_ID,
        routineId: 'rt-001',
        assignedByTrainerId: 'trainer-1',
        assignedAt: '2026-06-15T08:00:00.000Z',
        status: 'ACTIVE',
    },
    {
        id: 'mr-002',
        memberId: MOCK_MEMBER_ID,
        routineId: 'rt-002',
        assignedByTrainerId: 'trainer-1',
        assignedAt: '2026-06-16T08:00:00.000Z',
        status: 'ACTIVE',
    },
    {
        id: 'mr-003',
        memberId: MOCK_MEMBER_ID,
        routineId: 'rt-003',
        assignedByTrainerId: 'trainer-1',
        assignedAt: '2026-06-17T08:00:00.000Z',
        status: 'ACTIVE',
    },
];

export function getExerciseById(id: string): Exercise | undefined {
    return EXERCISES.find((e) => e.id === id);
}

export function getRoutineById(id: string): Routine | undefined {
    return ROUTINES.find((r) => r.id === id);
}

export function getMemberRoutineById(id: string): MemberRoutine | undefined {
    return MEMBER_ROUTINES.find((mr) => mr.id === id);
}

export function getMemberRoutinesForMember(memberId = MOCK_MEMBER_ID): MemberRoutine[] {
    return MEMBER_ROUTINES.filter((mr) => mr.memberId === memberId && mr.status === 'ACTIVE');
}

export function getRoutineForMemberRoutine(
    memberRoutineId: string,
): { memberRoutine: MemberRoutine; routine: Routine } | null {
    const memberRoutine = getMemberRoutineById(memberRoutineId);
    if (!memberRoutine) return null;
    const routine = getRoutineById(memberRoutine.routineId);
    if (!routine) return null;
    return { memberRoutine, routine };
}

export function getRoutineProgress(memberRoutineId: string, sessions: WorkoutSession[]): number {
    const completed = sessions.filter((s) => s.memberRoutineId === memberRoutineId && s.status === 'COMPLETED').length;
    // ponytail: progreso simple: 0% hasta la primera completada, 100% después
    return completed > 0 ? 100 : 0;
}

export function createEmptySession(memberRoutineId: string): WorkoutSession {
    const { routine } = getRoutineForMemberRoutine(memberRoutineId) ?? { routine: null };
    return {
        id: `ws-${Date.now()}`,
        memberRoutineId,
        date: new Date().toISOString(),
        exercises:
            routine?.exercises.map((re) => ({
                routineExerciseId: re.id,
                sets: Array.from({ length: re.sets }).map(() => ({ weight: undefined, reps: undefined, done: false })),
                notes: '',
            })) ?? [],
        confirmedByMember: false,
        status: 'IN_PROGRESS',
    };
}
