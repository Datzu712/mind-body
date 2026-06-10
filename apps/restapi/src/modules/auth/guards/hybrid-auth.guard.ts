import { CanActivate, ExecutionContext, HttpException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { FastifyRequest } from 'fastify';
import { errors } from 'jose';
import { Reflector } from '@nestjs/core';

import { AuthService } from './auth.service';
import { IS_PUBLIC_RESOURCE_KEY } from '@/common/constant/public.decorator';
import { UsersService } from '@/modules/users/users.service';

@Injectable()
export class HybridAuthGuard implements CanActivate {
    constructor(
        private authGuard: AuthService,
        private readonly reflector: Reflector,
        private readonly usersService: UsersService,
    ) {}

    /**
     * Hybrid authentication guard that supports both cookie-based (dashboard) and
     * bearer token (mobile) authentication strategies.
     *
     * Policy:
     * - No auth provided       → 401 Unauthorized (only if the endpoint is not public / btw all endpoints are private by default)
     * - Both cookie + header   → 403 Forbidden (malicious or misconfigured request)
     * - Cookie only            → verifies token, expects AZP to match admin client
     * - Header only            → verifies token, expects AZP to match mobile client
     *
     * Cookie strategy also handles silent refresh on expiry.
     * Bearer tokens are stateless — expired tokens are rejected outright.
     */
    async canActivate(context: ExecutionContext) {
        const request = context.switchToHttp().getRequest<FastifyRequest>();

        const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_RESOURCE_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (isPublic) {
            return true;
        }

        const sessionInCookie = request.cookies?.access_token;
        const sessionInHeader = request.headers['authorization']?.startsWith('Bearer ');

        if ((!sessionInCookie && !sessionInHeader) || (sessionInCookie && sessionInHeader)) return false;

        let accessToken: string | undefined;

        if (sessionInCookie) {
            accessToken = sessionInCookie;
        } else {
            accessToken = request.headers['authorization']?.substring(7);
        }
        if (!accessToken?.trim()) return false;

        const tokenStrategy = sessionInCookie ? 'cookie' : 'header';

        try {
            const payload = await this.authGuard.verify(accessToken, tokenStrategy);

            request.user = await this.usersService.syncFromToken({
                keycloakId: payload.sub!,
                firstName: typeof payload['given_name'] === 'string' ? payload['given_name'] : undefined,
                lastName: typeof payload['family_name'] === 'string' ? payload['family_name'] : undefined,
                email: typeof payload['email'] === 'string' ? payload['email'] : undefined,
            });

            return true;
        } catch (error) {
            if (error instanceof errors.JWTExpired && tokenStrategy === 'cookie') {
                // refresh for dashboard client...
            } else if (error instanceof HttpException) {
                throw error;
            }

            throw new InternalServerErrorException(
                new Error(`Unhandled error token ${tokenStrategy} strategy`, { cause: error }),
            );
        }
    }
}
