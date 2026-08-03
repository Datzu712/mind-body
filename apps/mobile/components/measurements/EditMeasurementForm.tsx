import { useCallback } from 'react';

import { useUpdateMeasurement } from '@/hooks/use-measurements';
import type { Measurement } from '@/lib/api/types/measurement';
import { MeasurementForm } from './MeasurementForm';
import { formatDate } from './constants';

/**
 * Corregir una medición ya registrada. No trae `Modal`: lo monta el historial en
 * lugar de la lista, dentro del `Modal` que ya está abierto.
 *
 * La fecha medida no se edita — no la digita el miembro, la pone el servidor al
 * registrar — así que va en el título, como contexto de qué se está corrigiendo.
 */
export function EditMeasurementForm({
    measurement,
    onClose,
    onSaved,
}: {
    measurement: Measurement;
    onClose: () => void;
    onSaved: () => void;
}) {
    const { mutate, isPending, error } = useUpdateMeasurement(measurement.id);

    const handleSubmit = useCallback(
        (values: Parameters<typeof mutate>[0]) => mutate(values, { onSuccess: onSaved }),
        [mutate, onSaved],
    );

    return (
        <MeasurementForm
            title={formatDate(measurement.measuredAt)}
            submitLabel="Guardar"
            initial={measurement}
            submitting={isPending}
            errorMessage={error?.message ?? null}
            onSubmit={handleSubmit}
            onClose={onClose}
        />
    );
}
