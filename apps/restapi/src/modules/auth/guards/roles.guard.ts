import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { FastifyRequest } from 'fastify';

import { ROLES_KEY } from '@/common/decorators/roles.decorator';
import { IS_PUBLIC_RESOURCE_KEY } from '@/common/constant/public.decorator';
import type { AppRole } from '@/common/constant/roles.constant';

/**
 * Authorization guard. Two rules, in order:
 *
 * 1. Un token sin ningún rol de la app no entra a ninguna ruta no pública. En el
 *    flujo normal es imposible: solo pasa con usuarios creados a mano en
 *    Keycloak, que tampoco tienen perfil en nuestro dominio.
 * 2. Con `@Roles(...)` se exige al menos uno de esos roles; sin el decorador
 *    basta estar autenticado (con rol).
 *
 * Must run after HybridAuthGuard so `request.roles` is already populated.
 */
@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private readonly reflector: Reflector) {}

    canActivate(context: ExecutionContext): boolean {
        const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_RESOURCE_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (isPublic) {
            return true;
        }

        const request = context.switchToHttp().getRequest<FastifyRequest>();
        const userRoles = request.roles ?? [];

        if (userRoles.length === 0) {
            throw new ForbiddenException('No application role assigned to this user.');
        }

        const requiredRoles = this.reflector.getAllAndOverride<AppRole[]>(ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (!requiredRoles?.length) {
            return true;
        }

        const isAllowed = requiredRoles.some((role) => userRoles.includes(role));
        if (!isAllowed) {
            throw new ForbiddenException('Insufficient role to access this resource.');
        }

        return true;
    }
}
