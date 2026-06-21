import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useApiClient } from '@/lib/api/client';
import { getMeasurements, getMeasurementSummary, createMeasurement } from '@/lib/api/measurements';
import type { CreateMeasurementPayload } from '@/lib/api/measurements';

export const MEASUREMENTS_QUERY_KEY = ['measurements'] as const;
export const MEASUREMENTS_SUMMARY_KEY = ['measurements', 'summary'] as const;

export function useMeasurements(from?: string, to?: string) {
    const api = useApiClient();

    return useQuery({
        queryKey: [...MEASUREMENTS_QUERY_KEY, { from, to }],
        queryFn: () => getMeasurements(api, from, to),
        staleTime: 5 * 60 * 1000,
    });
}

export function useMeasurementSummary() {
    const api = useApiClient();

    return useQuery({
        queryKey: MEASUREMENTS_SUMMARY_KEY,
        queryFn: () => getMeasurementSummary(api),
        staleTime: 5 * 60 * 1000,
    });
}

export function useCreateMeasurement() {
    const api = useApiClient();
    const qc = useQueryClient();

    return useMutation({
        mutationFn: (payload: CreateMeasurementPayload) => createMeasurement(api, payload),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: MEASUREMENTS_QUERY_KEY });
            qc.invalidateQueries({ queryKey: MEASUREMENTS_SUMMARY_KEY });
        },
    });
}
