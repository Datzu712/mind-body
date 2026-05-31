import { CanActivate, ExecutionContext, ForbiddenException, HttpException, Injectable, Logger } from '@nestjs/common';
import { FastifyRequest } from 'fastify';
import { errors } from 'jose';
import { Reflector } from '@nestjs/core';

import { AuthService } from './auth.service';
import { IS_PUBLIC_RESOURCE_KEY } from '@/common/constant/public.decorator';

@Injectable()
export class HybridAuthGuard implements CanActivate {
    private readonly logger = new Logger('HybridAuthGuard');

    constructor(
        private authGuard: AuthService,
        private readonly reflector: Reflector,
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

        if (!sessionInCookie && !sessionInHeader) return false;

        if (sessionInCookie && sessionInHeader) {
            throw new ForbiddenException('Multiple authentication methods provided. Please use only one.');
        }

        let accessToken: string | undefined;

        if (sessionInCookie) {
            accessToken = sessionInCookie;
        } else {
            accessToken = request.headers['authorization']?.substring(7);
        }

        if (!accessToken?.trim()) return false;

        const tokenStrategy = sessionInCookie ? 'cookie' : 'header';

        debugger;
        try {
            await this.authGuard.verify(accessToken, tokenStrategy);

            return true;
        } catch (error) {
            if (error instanceof errors.JWTExpired && tokenStrategy === 'cookie') {
                // refresh for dashboard client...
            } else if (error instanceof HttpException) {
                throw error;
            }

            this.logger.error(new Error(`Unhandled error token ${tokenStrategy} strategy`, { cause: error }));

            return false;
        }
    }
}
