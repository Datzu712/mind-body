import { describe, expect, it } from 'vitest';

import { isManagement, isTrainerScoped, type Actor } from '../src/common/auth/actor';
import type { AppRole } from '../src/common/constant/roles.constant';

const actorWith = (...roles: AppRole[]): Actor => ({ userId: 'user-1', roles });

describe('isManagement — ADMIN y STAFF son equivalentes', () => {
    const management: Array<[string, Actor]> = [
        ['ADMIN', actorWith('ADMIN')],
        ['STAFF', actorWith('STAFF')],
        ['ADMIN + TRAINER', actorWith('ADMIN', 'TRAINER')],
        ['STAFF + MEMBER', actorWith('STAFF', 'MEMBER')],
    ];
    it.each(management)('reconoce %s como gestión', (_label, actor) => {
        expect(isManagement(actor)).toBe(true);
    });

    const notManagement: Array<[string, Actor]> = [
        ['TRAINER', actorWith('TRAINER')],
        ['MEMBER', actorWith('MEMBER')],
        ['TRAINER + MEMBER', actorWith('TRAINER', 'MEMBER')],
        ['sin roles', actorWith()],
    ];
    it.each(notManagement)('no reconoce %s como gestión', (_label, actor) => {
        expect(isManagement(actor)).toBe(false);
    });
});

describe('isTrainerScoped — recorte de la vista del entrenador', () => {
    it('recorta a un TRAINER puro', () => {
        expect(isTrainerScoped(actorWith('TRAINER'))).toBe(true);
    });

    it('no recorta cuando además es gestión', () => {
        expect(isTrainerScoped(actorWith('TRAINER', 'ADMIN'))).toBe(false);
        expect(isTrainerScoped(actorWith('TRAINER', 'STAFF'))).toBe(false);
    });

    // El rol MEMBER no es una exención: el roster expone datos de miembros.
    it('sigue recortando cuando la cuenta también es MEMBER', () => {
        expect(isTrainerScoped(actorWith('TRAINER', 'MEMBER'))).toBe(true);
    });

    it('no aplica a quien no es entrenador', () => {
        expect(isTrainerScoped(actorWith('MEMBER'))).toBe(false);
        expect(isTrainerScoped(actorWith('ADMIN'))).toBe(false);
        expect(isTrainerScoped(actorWith())).toBe(false);
    });
});

// El catálogo de sesiones no pasa por este predicado: se recorta con el filtro
// explícito `mine=true`, no con los roles del token.
