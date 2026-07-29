import { okJson } from './http';
import type { Measurement, MeasurementSummary } from './types/measurement';

/**
 * Los valores que el miembro digita. Espeja `MeasurementValuesDto` del API y es
 * el body del PUT: lo que no venga se borra.
 */
export interface MeasurementValuesPayload {
    weightKg?: number;
    heightCm?: number;
    bodyFatPercentage?: number;
    waistCm?: number;
    notes?: string;
}

/** Crear agrega la fecha; corregir no la toca (el API la ignora). */
export interface CreateMeasurementPayload extends MeasurementValuesPayload {
    measuredAt?: string;
}

type ApiFetch = (path: string, options?: RequestInit) => Promise<Response>;

function parseMeasurement(raw: Record<string, unknown>): Measurement {
    return {
        id: raw.id as string,
        memberId: raw.memberId as string,
        measuredAt: raw.measuredAt as string,
        weightKg: raw.weightKg != null ? parseFloat(raw.weightKg as string) : null,
        heightCm: raw.heightCm != null ? parseFloat(raw.heightCm as string) : null,
        bodyFatPercentage: raw.bodyFatPercentage != null ? parseFloat(raw.bodyFatPercentage as string) : null,
        waistCm: raw.waistCm != null ? parseFloat(raw.waistCm as string) : null,
        notes: (raw.notes as string) ?? null,
        createdAt: raw.createdAt as string,
        updatedAt: raw.updatedAt as string,
    };
}

export async function createMeasurement(apiFetch: ApiFetch, payload: CreateMeasurementPayload): Promise<Measurement> {
    const res = await apiFetch('/measurements', {
        method: 'POST',
        body: JSON.stringify(payload),
    });
    return parseMeasurement(await okJson<Record<string, unknown>>(res));
}

export async function updateMeasurement(
    apiFetch: ApiFetch,
    id: string,
    payload: MeasurementValuesPayload,
): Promise<Measurement> {
    const res = await apiFetch(`/measurements/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
    });
    return parseMeasurement(await okJson<Record<string, unknown>>(res));
}

export async function getMeasurements(apiFetch: ApiFetch, from?: string, to?: string): Promise<Measurement[]> {
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    const qs = params.toString();
    const res = await apiFetch(`/measurements${qs ? `?${qs}` : ''}`);
    const raw = await okJson<Record<string, unknown>[]>(res);
    return raw.map(parseMeasurement);
}

export async function getMeasurementSummary(apiFetch: ApiFetch): Promise<MeasurementSummary> {
    const res = await apiFetch('/measurements/summary');
    const raw = await okJson<{
        first: Record<string, unknown> | null;
        latest: Record<string, unknown> | null;
        variations: MeasurementSummary['variations'];
        totalRecords: number;
    }>(res);

    return {
        first: raw.first ? parseMeasurement(raw.first) : null,
        latest: raw.latest ? parseMeasurement(raw.latest) : null,
        variations: raw.variations,
        totalRecords: raw.totalRecords,
    };
}

