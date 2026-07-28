import { useCallback } from 'react';
import { Modal } from 'react-native';

import { useMeasurementSummary, useCreateMeasurement } from '@/hooks/use-measurements';
import { MeasurementForm } from './MeasurementForm';

/**
 * Crear una medición. El form arranca con los valores de la última medición
 * porque casi nunca cambian todos de una vez.
 *
 * La pantalla lo monta al abrir y lo desmonta al cerrar: el form arranca limpio
 * sin efectos de reseteo, y nunca hay dos `Modal` vivos a la vez (iOS falla al
 * presentar uno sobre otro). El costo es la animación de salida.
 */
export function NewMeasurementModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
    const { data: summary, isPending } = useMeasurementSummary();
    const { mutate, isPending: saving, error } = useCreateMeasurement();

    const handleSubmit = useCallback(
        (values: Parameters<typeof mutate>[0]) => mutate(values, { onSuccess: onSaved }),
        [mutate, onSaved],
    );

    // El form se monta con los valores iniciales ya resueltos: si se montara
    // antes, habría que reaplicarlos al llegar el resumen y eso pisaría lo que el
    // usuario haya tecleado mientras tanto. Se espera a que la query termine, no
    // a que traiga datos, porque si falla `summary` queda undefined para siempre.
    if (isPending) return null;

    return (
        <Modal visible animationType="slide" statusBarTranslucent onRequestClose={onClose}>
            <MeasurementForm
                title="Nueva medición"
                submitLabel="Guardar"
                initial={summary?.latest ?? null}
                submitting={saving}
                errorMessage={error?.message ?? null}
                onSubmit={handleSubmit}
                onClose={onClose}
            />
        </Modal>
    );
}
