import { eq } from 'drizzle-orm';

import { Role, type AppRole } from '@/common/constant/roles.constant';
import { DomainHttpException } from '@/common/domain/domain-http.exception';
import { trainersInApp } from '@/infra/database/pg/schemas/schema';
import type { Db, DbTx } from '@/infra/database/pg/drizzle.types';

/**
 * Quién hace la petición: id del usuario del dominio + roles verificados del
 * token (los pone HybridAuthGuard). Los services deciden ownership con esto en
 * vez de inferirlo de la presencia de un perfil.
 */
export interface Actor {
    userId: string;
    roles: readonly AppRole[];
}

/** ADMIN y STAFF son equivalentes: gestión del gimnasio. */
export function isManagement(actor: Actor): boolean {
    return actor.roles.includes(Role.ADMIN) || actor.roles.includes(Role.STAFF);
}

/**
 * Un entrenador sin rol de gestión solo ve lo suyo en las superficies de
 * gestión: sus series y el roster de sus sesiones. Tener además el rol MEMBER
 * no lo exime — el roster expone nombres e historial de asistencia.
 *
 * El catálogo de sesiones NO se recorta con esto: es la misma agenda del gimnasio
 * que ya ve cualquier MEMBER en mobile, así que darle menos a un entrenador no
 * protege nada. Para su propia agenda, el cliente pide `mine=true`.
 */
export function isTrainerScoped(actor: Actor): boolean {
    return actor.roles.includes(Role.TRAINER) && !isManagement(actor);
}

/** Perfil de entrenador del actor; 403 si el rol TRAINER no tiene perfil en el dominio. */
export async function requireTrainerId(db: Db | DbTx, userId: string): Promise<string> {
    const [trainer] = await db
        .select({ id: trainersInApp.id })
        .from(trainersInApp)
        .where(eq(trainersInApp.userId, userId));
    if (!trainer) {
        throw new DomainHttpException(403, 'TRAINER_NOT_FOUND', 'El usuario no tiene un perfil de entrenador.', {
            userId,
        });
    }
    return trainer.id;
}
