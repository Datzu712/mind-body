import { useQuery } from '@tanstack/react-query';

import type { Measurement, MeasurementSummary } from '@/lib/api/types/measurement';
// import { useApiClient } from '@/lib/api/client';

export const MEASUREMENTS_QUERY_KEY = ['measurements'] as const;
export const MEASUREMENTS_SUMMARY_KEY = ['measurements', 'summary'] as const;

// ── Mock data ────────────────────────────────────────────────────────────────

const MOCK_MEASUREMENTS: Measurement[] = [
    {
        id: '1',
        memberId: 'm1',
        measuredAt: '2026-01-10',
        weightKg: 82.5,
        heightCm: 175,
        bodyFatPercentage: 22.0,
        waistCm: 90,
        notes: 'Medición inicial',
        createdAt: '2026-01-10T10:00:00Z',
    },
    {
        id: '2',
        memberId: 'm1',
        measuredAt: '2026-02-08',
        weightKg: 81.0,
        heightCm: 175,
        bodyFatPercentage: 21.2,
        waistCm: 88.5,
        notes: null,
        createdAt: '2026-02-08T10:00:00Z',
    },
    {
        id: '3',
        memberId: 'm1',
        measuredAt: '2026-03-12',
        weightKg: 79.8,
        heightCm: 175,
        bodyFatPercentage: 20.1,
        waistCm: 86,
        notes: 'Buen progreso',
        createdAt: '2026-03-12T10:00:00Z',
    },
    {
        id: '4',
        memberId: 'm1',
        measuredAt: '2026-04-15',
        weightKg: 78.2,
        heightCm: 175,
        bodyFatPercentage: 19.0,
        waistCm: 84,
        notes: null,
        createdAt: '2026-04-15T10:00:00Z',
    },
    {
        id: '5',
        memberId: 'm1',
        measuredAt: '2026-05-10',
        weightKg: 77.5,
        heightCm: 175,
        bodyFatPercentage: 18.3,
        waistCm: 83,
        notes: null,
        createdAt: '2026-05-10T10:00:00Z',
    },
    {
        id: '6',
        memberId: 'm1',
        measuredAt: '2026-06-14',
        weightKg: 76.8,
        heightCm: 175,
        bodyFatPercentage: 17.5,
        waistCm: 81.5,
        notes: 'Última medición',
        createdAt: '2026-06-14T10:00:00Z',
    },
];

// ── Hooks ────────────────────────────────────────────────────────────────────

/**
 * Fetch member measurements, optionally filtered by date range.
 * TODO: replace mock with apiFetch('/v1/measurements')
 */
export function useMeasurements(from?: string, to?: string) {
    return useQuery({
        queryKey: [...MEASUREMENTS_QUERY_KEY, { from, to }],
        queryFn: async () => {
            // TODO: const res = await apiFetch(`/v1/measurements?from=${from}&to=${to}`);
            let data = MOCK_MEASUREMENTS;
            if (from) data = data.filter((m) => m.measuredAt >= from);
            if (to) data = data.filter((m) => m.measuredAt <= to);
            return data.sort((a, b) => b.measuredAt.localeCompare(a.measuredAt));
        },
    });
}

/**
 * Fetch summary: first vs latest measurement with computed variations.
 * TODO: replace mock with apiFetch('/v1/measurements/summary')
 */
export function useMeasurementSummary() {
    return useQuery({
        queryKey: MEASUREMENTS_SUMMARY_KEY,
        queryFn: async (): Promise<MeasurementSummary> => {
            // TODO: const res = await apiFetch('/v1/measurements/summary');
            if (MOCK_MEASUREMENTS.length === 0) {
                return {
                    first: null,
                    latest: null,
                    variations: { weightKg: null, heightCm: null, bodyFatPercentage: null, waistCm: null },
                    totalRecords: 0,
                };
            }
            const sorted = [...MOCK_MEASUREMENTS].sort((a, b) => a.measuredAt.localeCompare(b.measuredAt));
            const first = sorted[0]!;
            const latest = sorted[sorted.length - 1]!;

            const delta = (a: number | null, b: number | null) => (a != null && b != null ? +(b - a).toFixed(2) : null);

            return {
                first,
                latest,
                variations: {
                    weightKg: delta(first.weightKg, latest.weightKg),
                    heightCm: delta(first.heightCm, latest.heightCm),
                    bodyFatPercentage: delta(first.bodyFatPercentage, latest.bodyFatPercentage),
                    waistCm: delta(first.waistCm, latest.waistCm),
                },
                totalRecords: MOCK_MEASUREMENTS.length,
            };
        },
    });
}
