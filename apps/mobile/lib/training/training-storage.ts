import { useCallback, useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';

import type { WorkoutSession } from './training-data';

const SESSIONS_KEY = 'training.workout_sessions';

async function loadSessionsRaw(): Promise<WorkoutSession[]> {
    try {
        const raw = await SecureStore.getItemAsync(SESSIONS_KEY);
        if (!raw) return [];
        return JSON.parse(raw) as WorkoutSession[];
    } catch {
        // ponytail: falla silenciosa a lista vacía en web/edge cases
        return [];
    }
}

async function saveSessionsRaw(sessions: WorkoutSession[]): Promise<void> {
    try {
        await SecureStore.setItemAsync(SESSIONS_KEY, JSON.stringify(sessions));
    } catch {
        // ponytail: no bloqueamos UI si secure store falla
    }
}

export async function loadWorkoutSessions(): Promise<WorkoutSession[]> {
    return loadSessionsRaw();
}

export async function saveWorkoutSession(session: WorkoutSession): Promise<void> {
    const sessions = await loadSessionsRaw();
    const idx = sessions.findIndex((s) => s.id === session.id);
    if (idx >= 0) {
        sessions[idx] = session;
    } else {
        sessions.push(session);
    }
    await saveSessionsRaw(sessions);
}

export async function getWorkoutSession(id: string): Promise<WorkoutSession | null> {
    const sessions = await loadSessionsRaw();
    return sessions.find((s) => s.id === id) ?? null;
}

export function useWorkoutSessions() {
    const [sessions, setSessions] = useState<WorkoutSession[]>([]);
    const [loading, setLoading] = useState(true);

    const refresh = useCallback(async () => {
        setLoading(true);
        const next = await loadWorkoutSessions();
        setSessions(next);
        setLoading(false);
    }, []);

    const save = useCallback(async (session: WorkoutSession) => {
        await saveWorkoutSession(session);
        setSessions((prev) => {
            const idx = prev.findIndex((s) => s.id === session.id);
            if (idx >= 0) {
                const next = [...prev];
                next[idx] = session;
                return next;
            }
            return [...prev, session];
        });
    }, []);

    useEffect(() => {
        refresh();
    }, [refresh]);

    return { sessions, loading, save, refresh };
}
