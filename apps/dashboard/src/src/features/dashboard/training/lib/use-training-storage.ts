'use client';

import { useState, useEffect, useCallback } from 'react';
import { mockExercises, initialRoutines, mockMemberRoutines, mockMembers } from './training-mocks';
import type { Exercise, Routine, MemberRoutine } from './training-types';

const EXERCISES_KEY = 'mab-training-exercises';
const ROUTINES_KEY = 'mab-training-routines';
const ASSIGNMENTS_KEY = 'mab-training-assignments';

function loadFromStorage<T>(key: string, fallback: T): T {
    if (typeof window === 'undefined') return fallback;
    try {
        const raw = window.localStorage.getItem(key);
        return raw ? (JSON.parse(raw) as T) : fallback;
    } catch {
        return fallback;
    }
}

function saveToStorage<T>(key: string, value: T): void {
    if (typeof window === 'undefined') return;
    try {
        window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
        // ignore quota/full storage errors
    }
}

export function useTrainingStorage() {
    const [exercises, setExercises] = useState<Exercise[]>(mockExercises);
    const [routines, setRoutines] = useState<Routine[]>(initialRoutines);
    const [assignments, setAssignments] = useState<MemberRoutine[]>(mockMemberRoutines);
    const [hydrated, setHydrated] = useState(false);

    useEffect(() => {
        setExercises(loadFromStorage(EXERCISES_KEY, mockExercises));
        setRoutines(loadFromStorage(ROUTINES_KEY, initialRoutines));
        setAssignments(loadFromStorage(ASSIGNMENTS_KEY, mockMemberRoutines));
        setHydrated(true);
    }, []);

    useEffect(() => {
        if (hydrated) saveToStorage(EXERCISES_KEY, exercises);
    }, [exercises, hydrated]);

    useEffect(() => {
        if (hydrated) saveToStorage(ROUTINES_KEY, routines);
    }, [routines, hydrated]);

    useEffect(() => {
        if (hydrated) saveToStorage(ASSIGNMENTS_KEY, assignments);
    }, [assignments, hydrated]);

    const addExercise = useCallback((exercise: Omit<Exercise, 'id'>) => {
        const newExercise: Exercise = { ...exercise, id: `e-${Date.now()}` };
        setExercises((prev) => [...prev, newExercise]);
        return newExercise;
    }, []);

    const updateExercise = useCallback((id: string, exercise: Partial<Exercise>) => {
        setExercises((prev) => prev.map((e) => (e.id === id ? { ...e, ...exercise } : e)));
    }, []);

    const deleteExercise = useCallback((id: string) => {
        setExercises((prev) => prev.filter((e) => e.id !== id));
    }, []);

    const addRoutine = useCallback(
        (routine: Omit<Routine, 'id' | 'createdAt' | 'updatedAt' | 'versions' | 'attachments'>) => {
            const now = new Date().toISOString();
            const newRoutine: Routine = {
                ...routine,
                id: `r-${Date.now()}`,
                attachments: [],
                versions: [],
                createdAt: now,
                updatedAt: now,
            };
            setRoutines((prev) => [...prev, newRoutine]);
            return newRoutine;
        },
        [],
    );

    const updateRoutine = useCallback((id: string, routine: Partial<Routine>, versionNote?: string) => {
        setRoutines((prev) =>
            prev.map((r) => {
                if (r.id !== id) return r;
                const snapshot: Routine['versions'][number] = {
                    id: `v-${Date.now()}`,
                    createdAt: r.updatedAt,
                    note: versionNote ?? 'Cambios guardados',
                    exercises: r.exercises,
                };
                return {
                    ...r,
                    ...routine,
                    versions: [snapshot, ...r.versions],
                    updatedAt: new Date().toISOString(),
                };
            }),
        );
    }, []);

    const deleteRoutine = useCallback((id: string) => {
        setRoutines((prev) => prev.filter((r) => r.id !== id));
    }, []);

    const addAttachment = useCallback((routineId: string, attachment: Omit<Routine['attachments'][number], 'id'>) => {
        setRoutines((prev) =>
            prev.map((r) =>
                r.id === routineId
                    ? { ...r, attachments: [...r.attachments, { ...attachment, id: `a-${Date.now()}` }] }
                    : r,
            ),
        );
    }, []);

    const removeAttachment = useCallback((routineId: string, attachmentId: string) => {
        setRoutines((prev) =>
            prev.map((r) =>
                r.id === routineId ? { ...r, attachments: r.attachments.filter((a) => a.id !== attachmentId) } : r,
            ),
        );
    }, []);

    const assignRoutine = useCallback((assignment: Omit<MemberRoutine, 'id' | 'assignedAt'>) => {
        const newAssignment: MemberRoutine = {
            ...assignment,
            id: `mr-${Date.now()}`,
            assignedAt: new Date().toISOString(),
        };
        setAssignments((prev) => [...prev, newAssignment]);
        return newAssignment;
    }, []);

    const unassignRoutine = useCallback((assignmentId: string) => {
        setAssignments((prev) => prev.filter((a) => a.id !== assignmentId));
    }, []);

    return {
        exercises,
        routines,
        assignments,
        members: mockMembers,
        hydrated,
        addExercise,
        updateExercise,
        deleteExercise,
        addRoutine,
        updateRoutine,
        deleteRoutine,
        addAttachment,
        removeAttachment,
        assignRoutine,
        unassignRoutine,
    } as const;
}
