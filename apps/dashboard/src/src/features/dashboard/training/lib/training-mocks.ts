import type { ClassAttendance, Exercise, GroupClass, Member, MemberRoutine, Routine } from './training-types';

export const mockExercises: Exercise[] = [
    {
        id: 'e1',
        name: 'Sentadilla con barra',
        muscleGroup: 'Piernas',
        description: 'Sentadilla tradicional con barra alta',
        status: 'ACTIVE',
    },
    {
        id: 'e2',
        name: 'Press de banca',
        muscleGroup: 'Pecho',
        description: 'Press de banca con barra',
        status: 'ACTIVE',
    },
    {
        id: 'e3',
        name: 'Peso muerto',
        muscleGroup: 'Espalda',
        description: 'Peso muerto rumano',
        status: 'ACTIVE',
    },
    {
        id: 'e4',
        name: 'Dominadas',
        muscleGroup: 'Espalda',
        description: 'Dominadas agarre prono',
        status: 'ACTIVE',
    },
    {
        id: 'e5',
        name: 'Plancha',
        muscleGroup: 'Core',
        description: 'Plancha abdominal isométrica',
        status: 'ACTIVE',
    },
];

const now = new Date().toISOString();

export const initialRoutines: Routine[] = [
    {
        id: 'r1',
        name: 'Rutina de fuerza básica',
        objective: 'Ganar fuerza general',
        status: 'ACTIVE',
        exercises: [
            { id: 're1', exerciseId: 'e1', displayOrder: 1, sets: 4, reps: '8', notes: '' },
            { id: 're2', exerciseId: 'e2', displayOrder: 2, sets: 4, reps: '8', notes: '' },
            { id: 're3', exerciseId: 'e3', displayOrder: 3, sets: 3, reps: '10', notes: '' },
        ],
        attachments: [],
        versions: [],
        createdAt: now,
        updatedAt: now,
    },
    {
        id: 'r2',
        name: 'Rutina de resistencia',
        objective: 'Mejorar resistencia muscular',
        status: 'DRAFT',
        exercises: [
            { id: 're4', exerciseId: 'e4', displayOrder: 1, sets: 3, reps: '12', notes: '' },
            { id: 're5', exerciseId: 'e5', displayOrder: 2, sets: 3, reps: '45s', notes: '' },
        ],
        attachments: [],
        versions: [],
        createdAt: now,
        updatedAt: now,
    },
];

export const mockMembers: Member[] = [
    { id: 'm1', name: 'Sofía Hernández' },
    { id: 'm2', name: 'Daniela Ruiz' },
    { id: 'm3', name: 'Mateo Castillo' },
    { id: 'm4', name: 'Lucía Mendoza' },
    { id: 'm5', name: 'Andrés Flores' },
];

export const mockMemberRoutines: MemberRoutine[] = [
    {
        id: 'mr1',
        memberId: 'm1',
        routineId: 'r1',
        assignedAt: now,
        status: 'ACTIVE',
    },
    {
        id: 'mr2',
        memberId: 'm3',
        routineId: 'r2',
        assignedAt: now,
        status: 'ACTIVE',
    },
];

const today = new Date().toISOString().split('T')[0];

export const mockClasses: GroupClass[] = [
    {
        id: 'c1',
        name: 'Yoga Básico',
        time: '08:00',
        capacity: 20,
        duration: '60 min',
        date: today,
    },
    {
        id: 'c2',
        name: 'Spinning',
        time: '10:00',
        capacity: 25,
        duration: '45 min',
        date: today,
    },
    {
        id: 'c3',
        name: 'CrossFit Intensivo',
        time: '18:00',
        capacity: 15,
        duration: '45 min',
        date: today,
    },
];

export function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
}

export const mockBookings: ClassAttendance[] = [
    {
        id: 'ca1',
        classId: 'c1',
        className: 'Yoga Básico',
        date: today,
        memberId: 'm1',
        memberName: 'Sofía Hernández',
        attended: false,
    },
    {
        id: 'ca2',
        classId: 'c1',
        className: 'Yoga Básico',
        date: today,
        memberId: 'm2',
        memberName: 'Daniela Ruiz',
        attended: false,
    },
    {
        id: 'ca3',
        classId: 'c1',
        className: 'Yoga Básico',
        date: today,
        memberId: 'm3',
        memberName: 'Mateo Castillo',
        attended: false,
    },
    {
        id: 'ca4',
        classId: 'c2',
        className: 'Spinning',
        date: today,
        memberId: 'm2',
        memberName: 'Daniela Ruiz',
        attended: false,
    },
    {
        id: 'ca5',
        classId: 'c2',
        className: 'Spinning',
        date: today,
        memberId: 'm4',
        memberName: 'Lucía Mendoza',
        attended: false,
    },
    {
        id: 'ca6',
        classId: 'c3',
        className: 'CrossFit Intensivo',
        date: today,
        memberId: 'm3',
        memberName: 'Mateo Castillo',
        attended: false,
    },
    {
        id: 'ca7',
        classId: 'c3',
        className: 'CrossFit Intensivo',
        date: today,
        memberId: 'm5',
        memberName: 'Andrés Flores',
        attended: false,
    },
];
