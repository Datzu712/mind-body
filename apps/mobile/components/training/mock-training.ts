import { FitColors as T } from '@/constants/theme';

export type ExerciseCategory = 'Fuerza' | 'Cardio' | 'Movilidad';
export type ExerciseLevel = 'Basico' | 'Intermedio' | 'Avanzado';
export type RoutineStatus = 'Activa' | 'Pausada' | 'Completada';
export type MemberExecutionStatus = 'Pendiente' | 'Parcial' | 'Confirmada';

export type TrainingExercise = {
    id: string;
    name: string;
    category: ExerciseCategory;
    muscleGroup: string;
    level: ExerciseLevel;
    equipment: string;
    sets: number;
    reps: string;
    load: string;
    rest: string;
    instructions: string[];
    accent: string;
    lastExecution?: {
        date: string;
        load: string;
        reps: string;
        note: string;
    };
};

export type RoutineAttachment = {
    id: string;
    name: string;
    type: 'PDF' | 'Video' | 'Imagen';
    size: string;
};

export type AssignedRoutine = {
    id: string;
    name: string;
    goal: string;
    trainer: string;
    member: string;
    day: string;
    frequency: string;
    durationMin: number;
    level: ExerciseLevel;
    status: RoutineStatus;
    executionStatus: MemberExecutionStatus;
    progress: number;
    accent: string;
    exercises: TrainingExercise[];
    attachments: RoutineAttachment[];
    notes: string;
    versionHistory: string[];
};

export type TrainerMember = {
    id: string;
    name: string;
    goal: string;
    adherence: number;
    activeRoutineId: string;
    lastCheckIn: string;
};

export type ClassAttendance = {
    id: string;
    className: string;
    time: string;
    reserved: number;
    attended: number;
    missing: string[];
};

export const TRAINING_EXERCISES: TrainingExercise[] = [
    {
        id: 'bench-press',
        name: 'Press de banca',
        category: 'Fuerza',
        muscleGroup: 'Pecho',
        level: 'Avanzado',
        equipment: 'Barra olimpica',
        sets: 4,
        reps: '8-10',
        load: '55 kg',
        rest: '90 s',
        accent: T.orange,
        instructions: [
            'Mantener escapulas retraidas antes de bajar la barra.',
            'Bajar controlado hasta el pecho sin rebotar.',
            'Empujar con pies firmes y terminar con codos extendidos.',
        ],
        lastExecution: {
            date: 'Lun 24 Jun',
            load: '52.5 kg',
            reps: '10 / 9 / 8 / 8',
            note: 'Buena tecnica, subir 2.5 kg si mantiene rango.',
        },
    },
    {
        id: 'incline-dumbbell',
        name: 'Press inclinado DB',
        category: 'Fuerza',
        muscleGroup: 'Pecho superior',
        level: 'Intermedio',
        equipment: 'Mancuernas',
        sets: 3,
        reps: '10-12',
        load: '22 kg',
        rest: '75 s',
        accent: T.yellow,
        instructions: [
            'Banco a 30 grados para evitar cargar demasiado el hombro.',
            'Controlar la bajada y mantener munecas neutras.',
            'Cerrar arriba sin chocar las mancuernas.',
        ],
        lastExecution: {
            date: 'Lun 24 Jun',
            load: '20 kg',
            reps: '12 / 11 / 10',
            note: 'Rango completo y sin dolor.',
        },
    },
    {
        id: 'deadlift',
        name: 'Peso muerto',
        category: 'Fuerza',
        muscleGroup: 'Cadena posterior',
        level: 'Avanzado',
        equipment: 'Barra olimpica',
        sets: 4,
        reps: '5',
        load: '85 kg',
        rest: '120 s',
        accent: T.red,
        instructions: [
            'Barra pegada a la tibia y columna neutra.',
            'Empujar el piso antes de extender cadera.',
            'Evitar hiperextension al final del movimiento.',
        ],
    },
    {
        id: 'rowing-erg',
        name: 'Remo indoor',
        category: 'Cardio',
        muscleGroup: 'Full body',
        level: 'Intermedio',
        equipment: 'Remoergometro',
        sets: 6,
        reps: '45 s',
        load: 'RPE 8',
        rest: '45 s',
        accent: T.blue,
        instructions: [
            'Primero piernas, luego tronco y brazos.',
            'Mantener cadencia estable durante cada intervalo.',
            'Respirar profundo en la recuperacion.',
        ],
    },
    {
        id: 'hip-mobility',
        name: 'Movilidad de cadera',
        category: 'Movilidad',
        muscleGroup: 'Cadera',
        level: 'Basico',
        equipment: 'Mat',
        sets: 3,
        reps: '60 s',
        load: 'Peso corporal',
        rest: '30 s',
        accent: '#64D2FF',
        instructions: [
            'Mantener respiracion nasal y lenta.',
            'No forzar rango si aparece dolor.',
            'Cambiar lado al finalizar cada minuto.',
        ],
    },
];

const byId = (id: string) => TRAINING_EXERCISES.find((exercise) => exercise.id === id) as TrainingExercise;

export const ASSIGNED_ROUTINES: AssignedRoutine[] = [
    {
        id: 'push-week-a',
        name: 'Pecho y triceps',
        goal: 'Hipertrofia controlada',
        trainer: 'Carlos Ruiz',
        member: 'Juan Perez',
        day: 'Lunes',
        frequency: '2 veces por semana',
        durationMin: 55,
        level: 'Avanzado',
        status: 'Activa',
        executionStatus: 'Parcial',
        progress: 42,
        accent: T.orange,
        exercises: [byId('bench-press'), byId('incline-dumbbell'), byId('hip-mobility')],
        attachments: [
            { id: 'att-1', name: 'Tecnica press banca', type: 'Video', size: '4 min' },
            { id: 'att-2', name: 'Rutina semana A', type: 'PDF', size: '1.2 MB' },
        ],
        notes: 'Priorizar tecnica antes de subir carga. Validar el ultimo set con el entrenador.',
        versionHistory: ['v3 publicada el 24 Jun', 'v2 ajuste de carga el 17 Jun', 'v1 asignada el 10 Jun'],
    },
    {
        id: 'pull-strength',
        name: 'Espalda fuerte',
        goal: 'Fuerza base',
        trainer: 'Ana Mora',
        member: 'Juan Perez',
        day: 'Miercoles',
        frequency: '1 vez por semana',
        durationMin: 60,
        level: 'Intermedio',
        status: 'Activa',
        executionStatus: 'Pendiente',
        progress: 0,
        accent: T.blue,
        exercises: [byId('deadlift'), byId('rowing-erg'), byId('hip-mobility')],
        attachments: [{ id: 'att-3', name: 'Checklist peso muerto', type: 'PDF', size: '820 KB' }],
        notes: 'Registrar RPE despues de cada bloque pesado.',
        versionHistory: ['v2 publicada el 22 Jun', 'v1 asignada el 12 Jun'],
    },
    {
        id: 'recovery-flow',
        name: 'Movilidad y recuperacion',
        goal: 'Recuperacion activa',
        trainer: 'Lucia Gomez',
        member: 'Juan Perez',
        day: 'Sabado',
        frequency: '1 vez por semana',
        durationMin: 30,
        level: 'Basico',
        status: 'Completada',
        executionStatus: 'Confirmada',
        progress: 100,
        accent: T.green,
        exercises: [byId('hip-mobility')],
        attachments: [],
        notes: 'Usar como descarga cuando haya fatiga alta.',
        versionHistory: ['v1 asignada el 08 Jun'],
    },
];

export const TRAINER_MEMBERS: TrainerMember[] = [
    {
        id: 'm-1',
        name: 'Juan Perez',
        goal: 'Ganar fuerza',
        adherence: 82,
        activeRoutineId: 'push-week-a',
        lastCheckIn: 'Hace 2 dias',
    },
    {
        id: 'm-2',
        name: 'Sofia Ramirez',
        goal: 'Recomposicion',
        adherence: 68,
        activeRoutineId: 'pull-strength',
        lastCheckIn: 'Ayer',
    },
    {
        id: 'm-3',
        name: 'Marco Castro',
        goal: 'Volver de lesion',
        adherence: 45,
        activeRoutineId: 'recovery-flow',
        lastCheckIn: 'Hace 6 dias',
    },
];

export const CLASS_ATTENDANCE: ClassAttendance[] = [
    {
        id: 'class-1',
        className: 'Functional fuerza',
        time: '07:00',
        reserved: 12,
        attended: 10,
        missing: ['Marco Castro', 'Elena Solis'],
    },
    {
        id: 'class-2',
        className: 'Core express',
        time: '18:00',
        reserved: 16,
        attended: 14,
        missing: ['Luis Vargas', 'Natalia Rojas'],
    },
];

export const getRoutineById = (id?: string | string[]) => {
    const key = Array.isArray(id) ? id[0] : id;
    return ASSIGNED_ROUTINES.find((routine) => routine.id === key) ?? ASSIGNED_ROUTINES[0];
};

export const getExerciseById = (id?: string | string[]) => {
    const key = Array.isArray(id) ? id[0] : id;
    return TRAINING_EXERCISES.find((exercise) => exercise.id === key) ?? TRAINING_EXERCISES[0];
};
