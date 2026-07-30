import type { Measurement, MeasurementSummary } from './types/measurement';

export interface MeasurementValuesPayload {
    weightKg?: number;
    heightCm?: number;
    bodyFatPercentage?: number;
    waistCm?: number;
    notes?: string;
}

export interface CreateMeasurementPayload extends MeasurementValuesPayload {
    measuredAt?: string;
}

type ApiFetch = (path: string, options?: RequestInit) => Promise<Response>;

// Mock Data
let mockMeasurements: Measurement[] = [
    {
        id: 'mock-1',
        memberId: 'mock-member',
        measuredAt: new Date(Date.now() - 86400000 * 5).toISOString(),
        weightKg: 70.5,
        heightCm: 170,
        bodyFatPercentage: 15,
        waistCm: 80,
        notes: 'Initial measurement',
        createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
        updatedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    },
    {
        id: 'mock-2',
        memberId: 'mock-member',
        measuredAt: new Date().toISOString(),
        weightKg: 69.0,
        heightCm: 170,
        bodyFatPercentage: 14.5,
        waistCm: 79,
        notes: 'Looking good',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    }
];

function delay<T>(data: T, ms = 500): Promise<T> {
    return new Promise(resolve => setTimeout(() => resolve(data), ms));
}

export async function createMeasurement(_apiFetch: ApiFetch, payload: CreateMeasurementPayload): Promise<Measurement> {
    const newMeasurement: Measurement = {
        id: 'mock-' + Date.now(),
        memberId: 'mock-member',
        measuredAt: payload.measuredAt || new Date().toISOString(),
        weightKg: payload.weightKg ?? null,
        heightCm: payload.heightCm ?? null,
        bodyFatPercentage: payload.bodyFatPercentage ?? null,
        waistCm: payload.waistCm ?? null,
        notes: payload.notes ?? null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };
    mockMeasurements.push(newMeasurement);
    mockMeasurements.sort((a, b) => new Date(b.measuredAt).getTime() - new Date(a.measuredAt).getTime());
    return delay(newMeasurement);
}

export async function updateMeasurement(
    _apiFetch: ApiFetch,
    id: string,
    payload: MeasurementValuesPayload,
): Promise<Measurement> {
    const index = mockMeasurements.findIndex(m => m.id === id);
    if (index === -1) throw new Error('Measurement not found');
    
    const updated = {
        ...mockMeasurements[index],
        weightKg: payload.weightKg ?? null,
        heightCm: payload.heightCm ?? null,
        bodyFatPercentage: payload.bodyFatPercentage ?? null,
        waistCm: payload.waistCm ?? null,
        notes: payload.notes ?? null,
        updatedAt: new Date().toISOString(),
    };
    mockMeasurements[index] = updated;
    return delay(updated);
}

export async function getMeasurements(_apiFetch: ApiFetch, _from?: string, _to?: string): Promise<Measurement[]> {
    return delay([...mockMeasurements]);
}

export async function getMeasurementSummary(_apiFetch: ApiFetch): Promise<MeasurementSummary> {
    const latest = mockMeasurements[0] || null;
    const first = mockMeasurements[mockMeasurements.length - 1] || null;
    return delay({
        first,
        latest,
        variations: {
            weightKg: latest && first ? (latest.weightKg ?? 0) - (first.weightKg ?? 0) : null,
            heightCm: latest && first ? (latest.heightCm ?? 0) - (first.heightCm ?? 0) : null,
            bodyFatPercentage: latest && first ? (latest.bodyFatPercentage ?? 0) - (first.bodyFatPercentage ?? 0) : null,
            waistCm: latest && first ? (latest.waistCm ?? 0) - (first.waistCm ?? 0) : null,
        },
        totalRecords: mockMeasurements.length,
    });
}
