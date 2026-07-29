import { useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useApiClient } from '@/lib/api/client';
import { ApiError } from '@/lib/api/http';
import { getMeasurements, getMeasurementSummary, createMeasurement, updateMeasurement } from '@/lib/api/measurements';
import type { CreateMeasurementPayload, MeasurementValuesPayload } from '@/lib/api/measurements';

export const MEASUREMENTS_QUERY_KEY = ['measurements'] as const;
export const MEASUREMENTS_SUMMARY_KEY = ['measurements', 'summary'] as const;

/**
 * `['measurements']` es prefijo tanto de la lista como del resumen, así que una
 * sola invalidación refresca historial, comparación y gráficos.
 */
function useRefreshMeasurements() {
    const qc = useQueryClient();

    return useCallback(() => {
        void qc.invalidateQueries({ queryKey: MEASUREMENTS_QUERY_KEY });
    }, [qc]);
}

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
    const refresh = useRefreshMeasurements();

    return useMutation({
        mutationFn: (payload: CreateMeasurementPayload) => createMeasurement(api, payload),
        onSuccess: refresh,
    });
}

export function useUpdateMeasurement(id: string) {
    const api = useApiClient();
    const refresh = useRefreshMeasurements();

    return useMutation({
        mutationFn: (payload: MeasurementValuesPayload) => updateMeasurement(api, id, payload),
        onSuccess: refresh,
        // Si el API rechaza por ventana vencida, la lista que dibujó el botón está
        // vieja: se refresca para que la acción desaparezca en lugar de dejar al
        // usuario reintentando contra un 409 fijo.
        onError: (error) => {
            if (error instanceof ApiError && error.code === 'MEASUREMENT_EDIT_WINDOW_EXPIRED') refresh();
        },
    });
}

