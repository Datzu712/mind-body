import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import type { FastifyRequest } from 'fastify';

import type { Actor } from '@/common/auth/actor';
import type { User } from '@/infra/database/pg/schemas/schema';

/**
 * Usuario + roles del token en un solo objeto. Depende de HybridAuthGuard: en
 * una ruta `@Public()` no hay actor y pedirlo es un error de programación.
 */
export const CurrentActor = createParamDecorator<unknown, Actor>((_data: unknown, ctx: ExecutionContext): Actor => {
    const request = ctx.switchToHttp().getRequest<FastifyRequest>();
    const user = request.user as User | undefined;
    if (!user) {
        throw new UnauthorizedException('No authenticated user in request.');
    }
    return { userId: user.id, roles: request.roles ?? [] };
});
