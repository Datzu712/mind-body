import type {
    CreateExerciseLogPayload,
    ExerciseLog,
    Notification,
    Routine,
    TrainingSession,
} from './types/training';

type ApiFetch = (path: string, options?: RequestInit) => Promise<Response>;

const API_PREFIX = '/api/v1';

export async function getRoutines(apiFetch: ApiFetch): Promise<Routine[]> {
    const res = await apiFetch(`${API_PREFIX}/routines?scope=member`);
    if (!res.ok) throw new Error(`Error ${res.status} al cargar rutinas`);
    return res.json();
}

export async function getRoutine(apiFetch: ApiFetch, id: string): Promise<Routine> {
    const res = await apiFetch(`${API_PREFIX}/routines/${id}?scope=member`);
    if (!res.ok) throw new Error(`Error ${res.status} al cargar la rutina`);
    return res.json();
}

export async function getSessions(apiFetch: ApiFetch): Promise<TrainingSession[]> {
    const res = await apiFetch(`${API_PREFIX}/sessions?scope=member`);
    if (!res.ok) throw new Error(`Error ${res.status} al cargar sesiones`);
    return res.json();
}

export async function getSession(apiFetch: ApiFetch, id: string): Promise<TrainingSession> {
    const res = await apiFetch(`${API_PREFIX}/sessions/${id}?scope=member`);
    if (!res.ok) throw new Error(`Error ${res.status} al cargar la sesión`);
    const data = (await res.json()) as { session: TrainingSession; exerciseLogs: ExerciseLog[] };
    return { ...data.session, exerciseLogs: data.exerciseLogs };
}

export async function createSession(apiFetch: ApiFetch, memberRoutineId: string): Promise<TrainingSession> {
    const res = await apiFetch(`${API_PREFIX}/sessions`, {
        method: 'POST',
        body: JSON.stringify({ memberRoutineId }),
    });
    if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message ?? `Error ${res.status} al crear la sesión`);
    }
    return res.json();
}

export async function updateExerciseLog(
    apiFetch: ApiFetch,
    sessionId: string,
    payload: CreateExerciseLogPayload,
): Promise<ExerciseLog> {
    const res = await apiFetch(`${API_PREFIX}/sessions/${sessionId}/exercise-logs`, {
        method: 'POST',
        body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`Error ${res.status} al guardar el ejercicio`);
    return res.json();
}

export async function confirmSession(apiFetch: ApiFetch, sessionId: string): Promise<TrainingSession> {
    const res = await apiFetch(`${API_PREFIX}/sessions/${sessionId}/confirm`, { method: 'POST' });
    if (!res.ok) throw new Error(`Error ${res.status} al confirmar la sesión`);
    return res.json();
}

export async function validateSession(apiFetch: ApiFetch, sessionId: string): Promise<TrainingSession> {
    const res = await apiFetch(`${API_PREFIX}/sessions/${sessionId}/validate`, { method: 'POST' });
    if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message ?? `Error ${res.status} al validar la sesión`);
    }
    return res.json();
}

export async function getNotifications(apiFetch: ApiFetch): Promise<Notification[]> {
    const res = await apiFetch(`${API_PREFIX}/notifications`);
    if (!res.ok) throw new Error(`Error ${res.status} al cargar notificaciones`);
    return res.json();
}

export async function markNotificationRead(apiFetch: ApiFetch, id: string): Promise<Notification> {
    const res = await apiFetch(`${API_PREFIX}/notifications/${id}/read`, { method: 'POST' });
    if (!res.ok) throw new Error(`Error ${res.status} al marcar notificación`);
    return res.json();
}
