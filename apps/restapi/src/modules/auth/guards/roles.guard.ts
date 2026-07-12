import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { FastifyRequest } from 'fastify';

import { ROLES_KEY } from '@/common/decorators/roles.decorator';
import { IS_PUBLIC_RESOURCE_KEY } from '@/common/constant/public.decorator';
import type { AppRole } from '@/common/constant/roles.constant';

/**
 * Authorization guard: opt-in per route via `@Roles(...)`. Routes without the
 * decorator (or marked `@Public()`) are left to HybridAuthGuard alone.
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

        const requiredRoles = this.reflector.getAllAndOverride<AppRole[]>(ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (!requiredRoles?.length) {
            return true;
        }

        const request = context.switchToHttp().getRequest<FastifyRequest>();
        const userRoles = request.roles ?? [];

        const isAllowed = requiredRoles.some((role) => userRoles.includes(role));
        if (!isAllowed) {
            throw new ForbiddenException('Insufficient role to access this resource.');
        }

        return true;
    }
}
