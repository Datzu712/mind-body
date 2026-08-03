import type { DateTime } from 'luxon';

import { DomainHttpException } from '@/common/domain/domain-http.exception';

/**
 * Días que el miembro tiene para corregir una medición. Mobile espeja esta
 * constante para mostrar u ocultar el botón de editar
 * (`apps/mobile/components/measurements/constants.ts`), pero la autoridad es
 * este módulo: el cliente decide qué dibuja, el API decide qué acepta.
 */
export const MEASUREMENT_EDIT_WINDOW_DAYS = 7;

/** Instante hasta el que se puede corregir una medición creada en `createdAt`. */
export function editableUntil(createdAt: DateTime): DateTime {
    return createdAt.plus({ days: MEASUREMENT_EDIT_WINDOW_DAYS });
}

/**
 * La ventana se ancla en `createdAt` y no en `measuredAt`: el primero lo pone el
 * servidor y es inmutable, el segundo lo elige el cliente y se podría posdatar
 * para dejar una medición editable para siempre.
 *
 * `now` entra por parámetro (viene de `ClockService`) para que la regla sea una
 * función pura y testeable sin BD ni Nest.
 */
export function assertEditable(createdAt: DateTime, now: DateTime): void {
    const limit = editableUntil(createdAt);

    if (now > limit) {
        throw new DomainHttpException(
            409,
            'MEASUREMENT_EDIT_WINDOW_EXPIRED',
            `Solo se puede corregir una medición durante los ${MEASUREMENT_EDIT_WINDOW_DAYS} días siguientes a su registro.`,
            {
                createdAt: createdAt.toISO(),
                editableUntil: limit.toISO(),
                windowDays: MEASUREMENT_EDIT_WINDOW_DAYS,
            },
        );
    }
}
