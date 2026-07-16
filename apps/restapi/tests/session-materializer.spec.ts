import { describe, expect, it } from 'vitest';
import { occurrenceLocalDates } from '@/modules/classes/session-materializer.service';
import { pgErrorCode } from '@/infra/database/pg/pg-error';

// 2026-07-13 es lunes (ISO weekday 1).

describe('occurrenceLocalDates', () => {
    it('genera exactamente una fecha por weekday configurado dentro del horizonte', () => {
        const dates = occurrenceLocalDates({
            startsOn: '2026-07-13',
            weekdays: [1, 3], // lunes y miércoles
            today: '2026-07-13',
            weeksAhead: 2,
        });
        expect(dates).toEqual(['2026-07-13', '2026-07-15', '2026-07-20', '2026-07-22']);
    });

    it('la ventana es semiabierta: excluye today + weeksAhead*7', () => {
        const dates = occurrenceLocalDates({
            startsOn: '2026-07-13',
            weekdays: [1],
            today: '2026-07-13',
            weeksAhead: 1,
        });
        // La semana [13, 20) incluye solo el lunes 13; el lunes 20 queda fuera.
        expect(dates).toEqual(['2026-07-13']);
    });

    it('empieza en startsOn cuando es posterior a today', () => {
        const dates = occurrenceLocalDates({
            startsOn: '2026-07-20',
            weekdays: [1, 2],
            today: '2026-07-13',
            weeksAhead: 2,
        });
        expect(dates).toEqual(['2026-07-20', '2026-07-21']);
    });

    it('startsOn más allá del horizonte no genera nada', () => {
        const dates = occurrenceLocalDates({
            startsOn: '2026-09-01',
            weekdays: [1, 2, 3, 4, 5, 6, 7],
            today: '2026-07-13',
            weeksAhead: 2,
        });
        expect(dates).toEqual([]);
    });

    it('startsOn en el pasado arranca en today (no materializa retrospectivo)', () => {
        const dates = occurrenceLocalDates({
            startsOn: '2026-01-01',
            weekdays: [7], // domingo
            today: '2026-07-14', // martes
            weeksAhead: 1,
        });
        expect(dates).toEqual(['2026-07-19']);
    });

    it('es determinista: dos corridas producen lo mismo', () => {
        const params = { startsOn: '2026-07-13', weekdays: [5], today: '2026-07-13', weeksAhead: 4 };
        expect(occurrenceLocalDates(params)).toEqual(occurrenceLocalDates(params));
    });
});

describe('pgErrorCode', () => {
    it('lee el code directo', () => {
        expect(pgErrorCode({ code: '23P01' })).toBe('23P01');
    });

    it('camina la cadena de causes (errores envueltos por drizzle)', () => {
        const wrapped = new Error('query failed');
        (wrapped as Error & { cause: unknown }).cause = { code: '23505' };
        expect(pgErrorCode(new Error('outer', { cause: wrapped }))).toBe('23505');
    });

    it('devuelve undefined cuando no hay code', () => {
        expect(pgErrorCode(new Error('plain'))).toBeUndefined();
        expect(pgErrorCode(undefined)).toBeUndefined();
    });
});
