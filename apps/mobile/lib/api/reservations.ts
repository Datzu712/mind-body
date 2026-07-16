/**
 * Módulo de reservas conectado al API real (apps/restapi). Reemplaza el mock.
 *
 * El backend habla inglés/ISO (SessionDto, ReservationDto); acá se proyecta al
 * dominio en español que consumen las pantallas. La lista de espera NO existe
 * en v1 (solo el flag allowWaitlist), así que no se expone nada de waitlist.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { addDays, format } from 'date-fns';
import { es } from 'date-fns/locale';

import { FitColors as T } from '@/constants/theme';
import { useApiClient } from './client';

export type ClassLevel = 'Bajo' | 'Medio' | 'Alto';

export type GymSession = {
    /** id de la SESIÓN (UUID). */
    id: string;
    name: string;
    trainer: string;
    /** YYYY-MM-DD local del negocio. */
    date: string;
    /** "Lun 9 jun" */
    dateLabel: string;
    /** "07:00 - 08:00" */
    time: string;
    durationMin: number;
    level: ClassLevel | null;
    category: string | null;
    room: string | null;
    zone: string | null;
    capacity: number;
    booked: number;
    spotsLeft: number;
    description: string;
    /** Color de acento derivado de la categoría (presentación local). */
    accent: string;
    /** Proyección del propio miembro calculada por el server. */
    viewer: { reservationId: string | null; hasConflict: boolean } | null;
};

export type ReservationView = {
    id: string;
    sessionId: string;
    className: string;
    trainer: string;
    room: string | null;
    dateLabel: string;
    time: string;
    status: 'confirmada' | 'reprogramada' | 'asistida' | 'no-asistio' | 'cancelacion-tardia' | 'cancelada';
};

export const LOW_SPOTS_THRESHOLD = 2;
export const hasNoSpots = (c: Pick<GymSession, 'spotsLeft'>) => c.spotsLeft <= 0;
export const hasLowSpots = (c: Pick<GymSession, 'spotsLeft'>) => c.spotsLeft > 0 && c.spotsLeft <= LOW_SPOTS_THRESHOLD;

const ACCENTS: Record<string, string> = {
    yoga: T.purple,
    fuerza: T.orange,
    cardio: T.blue,
    mind: T.green,
};
const ACCENT_POOL = [T.orange, T.purple, T.blue, T.green];

/** Acento estable por categoría; las desconocidas rotan por hash del nombre. */
export function accentFor(category: string | null): string {
    if (!category) return T.yellow;
    const known = ACCENTS[category.toLowerCase()];
    if (known) return known;
    let hash = 0;
    for (const ch of category) hash = (hash * 31 + ch.charCodeAt(0)) % 997;
    return ACCENT_POOL[hash % ACCENT_POOL.length];
}

type ApiLevel = 'LOW' | 'MEDIUM' | 'HIGH' | null;

interface ApiSession {
    id: string;
    className: string;
    description: string;
    trainerName: string;
    localDate: string;
    startTime: string;
    endTime: string;
    capacity: number;
    booked: number;
    availableSpots: number;
    status: 'SCHEDULED' | 'CANCELLED';
    category: string | null;
    level: ApiLevel;
    room: string | null;
    zone: string | null;
    viewer: { reservationId: string | null; hasConflict: boolean } | null;
}

interface ApiReservation {
    id: string;
    status: 'CONFIRMED' | 'ATTENDED' | 'NO_SHOW' | 'CANCELLED';
    statusReason: string;
    rescheduledFromReservationId: string | null;
    session: {
        id: string;
        className: string;
        trainerName: string;
        startsAt: string;
        endsAt: string;
        room: string | null;
    };
}

const LEVEL_LABEL: Record<Exclude<ApiLevel, null>, ClassLevel> = { LOW: 'Bajo', MEDIUM: 'Medio', HIGH: 'Alto' };

function durationMinutes(startTime: string, endTime: string): number {
    const [sh, sm] = startTime.split(':').map(Number);
    const [eh, em] = endTime.split(':').map(Number);
    return (eh! * 60 + em! - (sh! * 60 + sm!) + 24 * 60) % (24 * 60);
}

function dateLabelOf(date: Date): string {
    const label = format(date, 'EEE d MMM', { locale: es });
    return label.charAt(0).toUpperCase() + label.slice(1);
}

function toGymSession(api: ApiSession): GymSession {
    return {
        id: api.id,
        name: api.className,
        trainer: api.trainerName,
        date: api.localDate,
        dateLabel: dateLabelOf(new Date(`${api.localDate}T00:00:00`)),
        time: `${api.startTime} - ${api.endTime}`,
        durationMin: durationMinutes(api.startTime, api.endTime),
        level: api.level ? LEVEL_LABEL[api.level] : null,
        category: api.category,
        room: api.room,
        zone: api.zone,
        capacity: api.capacity,
        booked: api.booked,
        spotsLeft: api.availableSpots,
        description: api.description,
        accent: accentFor(api.category),
        viewer: api.viewer,
    };
}

function toReservationView(api: ApiReservation): ReservationView {
    const starts = new Date(api.session.startsAt);
    const ends = new Date(api.session.endsAt);
    const timeOf = (d: Date) => format(d, 'HH:mm');

    let status: ReservationView['status'];
    if (api.status === 'CONFIRMED') status = api.rescheduledFromReservationId ? 'reprogramada' : 'confirmada';
    else if (api.status === 'ATTENDED') status = 'asistida';
    else if (api.status === 'NO_SHOW')
        status = api.statusReason === 'LATE_CANCELLATION' ? 'cancelacion-tardia' : 'no-asistio';
    else status = 'cancelada';

    return {
        id: api.id,
        sessionId: api.session.id,
        className: api.session.className,
        trainer: api.session.trainerName,
        room: api.session.room,
        dateLabel: dateLabelOf(starts),
        time: `${timeOf(starts)} - ${timeOf(ends)}`,
        status,
    };
}

/** Lanza con el mensaje del backend (`{ message }` de DomainHttpException). */
async function okJson<T>(res: Response): Promise<T> {
    if (!res.ok) {
        let message = `Error ${res.status}`;
        try {
            const body = (await res.json()) as { message?: unknown };
            if (typeof body.message === 'string' && body.message) message = body.message;
        } catch {
            /* body no-JSON: se usa el mensaje genérico */
        }
        throw new Error(message);
    }
    return (await res.json()) as T;
}

// ── Hooks ───────────────────────────────────────────────────────────────────

const DAYS_AHEAD = 6;

/** Sesiones futuras de los próximos 7 días (hoy incluido). */
export function useUpcomingSessions() {
    const apiFetch = useApiClient();
    const from = format(new Date(), 'yyyy-MM-dd');
    const to = format(addDays(new Date(), DAYS_AHEAD), 'yyyy-MM-dd');

    return useQuery({
        queryKey: ['sessions', 'range', from, to],
        queryFn: async () => {
            const rows = await okJson<ApiSession[]>(await apiFetch(`/class-sessions?from=${from}&to=${to}`));
            const now = new Date();
            return rows
                .filter((s) => s.status === 'SCHEDULED')
                .map(toGymSession)
                .filter((s) => new Date(`${s.date}T${s.time.slice(0, 5)}:00`) > now);
        },
    });
}

export function useSessionDetail(id: string | undefined) {
    const apiFetch = useApiClient();
    return useQuery({
        queryKey: ['sessions', 'detail', id],
        queryFn: async () => toGymSession(await okJson<ApiSession>(await apiFetch(`/class-sessions/${id}`))),
        enabled: !!id,
    });
}

export function useMyReservations(scope: 'UPCOMING' | 'HISTORY') {
    const apiFetch = useApiClient();
    return useQuery({
        queryKey: ['my-reservations', scope],
        queryFn: async () => {
            const rows = await okJson<ApiReservation[]>(await apiFetch(`/reservations/me?scope=${scope}`));
            return rows.map(toReservationView);
        },
    });
}

export function useRescheduleOptions(reservationId: string | undefined) {
    const apiFetch = useApiClient();
    return useQuery({
        queryKey: ['reservations', reservationId, 'reschedule-options'],
        queryFn: async () => {
            const rows = await okJson<ApiSession[]>(
                await apiFetch(`/reservations/${reservationId}/reschedule-options`),
            );
            return rows.map(toGymSession);
        },
        enabled: !!reservationId,
    });
}

function useInvalidateReservationData() {
    const queryClient = useQueryClient();
    return () => {
        void queryClient.invalidateQueries({ queryKey: ['sessions'] });
        void queryClient.invalidateQueries({ queryKey: ['my-reservations'] });
        void queryClient.invalidateQueries({ queryKey: ['reservations'] });
    };
}

export function useBookSession() {
    const apiFetch = useApiClient();
    const invalidate = useInvalidateReservationData();
    return useMutation({
        mutationFn: async (sessionId: string) =>
            okJson(await apiFetch(`/class-sessions/${sessionId}/reservations`, { method: 'POST' })),
        onSuccess: invalidate,
    });
}

export function useCancelReservation() {
    const apiFetch = useApiClient();
    const invalidate = useInvalidateReservationData();
    return useMutation({
        mutationFn: async (reservationId: string) =>
            okJson<{ registeredAsNoShow: boolean }>(
                await apiFetch(`/reservations/${reservationId}/cancel`, { method: 'POST' }),
            ),
        onSuccess: invalidate,
    });
}

export function useRescheduleReservation() {
    const apiFetch = useApiClient();
    const invalidate = useInvalidateReservationData();
    return useMutation({
        mutationFn: async ({ reservationId, targetSessionId }: { reservationId: string; targetSessionId: string }) =>
            okJson(
                await apiFetch(`/reservations/${reservationId}/reschedule`, {
                    method: 'POST',
                    body: JSON.stringify({ targetSessionId }),
                }),
            ),
        onSuccess: invalidate,
    });
}
