import { describe, expect, it } from 'vitest';
import { DateTime } from 'luxon';

import {
    MEASUREMENT_EDIT_WINDOW_DAYS,
    assertEditable,
    editableUntil,
} from '@/modules/measurements/measurement-edit-policy';
import { DomainHttpException } from '@/common/domain/domain-http.exception';

const ZONE = 'America/Costa_Rica';
const createdAt = DateTime.fromISO('2026-07-01T09:00:00', { zone: ZONE });

/** El body de DomainHttpException es el contrato que consume mobile. */
function bodyOf(fn: () => void) {
    try {
        fn();
    } catch (error) {
        expect(error).toBeInstanceOf(DomainHttpException);
        return (error as DomainHttpException).getResponse() as {
            statusCode: number;
            code: string;
            details: Record<string, unknown>;
        };
    }
    throw new Error('se esperaba que lanzara');
}

describe('editableUntil', () => {
    it(`corre ${MEASUREMENT_EDIT_WINDOW_DAYS} días desde la creación`, () => {
        expect(editableUntil(createdAt).toISO()).toBe(createdAt.plus({ days: MEASUREMENT_EDIT_WINDOW_DAYS }).toISO());
    });
});

describe('assertEditable', () => {
    it('deja corregir el mismo día', () => {
        expect(() => assertEditable(createdAt, createdAt.plus({ minutes: 1 }))).not.toThrow();
    });

    it('deja corregir en el último instante de la ventana', () => {
        expect(() => assertEditable(createdAt, editableUntil(createdAt))).not.toThrow();
    });

    it('rechaza un segundo después del límite', () => {
        expect(() => assertEditable(createdAt, editableUntil(createdAt).plus({ seconds: 1 }))).toThrow(
            DomainHttpException,
        );
    });

    it('responde 409 con código y detalles estables', () => {
        const body = bodyOf(() => assertEditable(createdAt, createdAt.plus({ days: 30 })));

        expect(body.statusCode).toBe(409);
        expect(body.code).toBe('MEASUREMENT_EDIT_WINDOW_EXPIRED');
        expect(body.details).toMatchObject({
            createdAt: createdAt.toISO(),
            editableUntil: editableUntil(createdAt).toISO(),
            windowDays: MEASUREMENT_EDIT_WINDOW_DAYS,
        });
    });

    it('compara instantes, no relojes de pared: la zona de `now` no cambia el veredicto', () => {
        const dentro = editableUntil(createdAt).minus({ hours: 1 });

        expect(() => assertEditable(createdAt, dentro.setZone('UTC'))).not.toThrow();
        expect(() => assertEditable(createdAt, dentro.setZone('Asia/Tokyo'))).not.toThrow();
        expect(() => assertEditable(createdAt, dentro.plus({ hours: 2 }).setZone('UTC'))).toThrow(DomainHttpException);
    });

    it('una medición posdatada no gana ventana: el ancla es createdAt', () => {
        // measuredAt no participa de la regla; si el cliente lo posdatara, la
        // ventana seguiría corriendo desde el registro real.
        const registrada = DateTime.fromISO('2026-01-01T00:00:00', { zone: ZONE });

        expect(() => assertEditable(registrada, DateTime.fromISO('2026-07-01T00:00:00', { zone: ZONE }))).toThrow(
            DomainHttpException,
        );
    });
});
