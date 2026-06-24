import {
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    HttpException,
    Injectable,
    InternalServerErrorException,
    Logger,
    UnauthorizedException,
} from '@nestjs/common';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { errors } from 'jose';
import { Reflector } from '@nestjs/core';

import { AuthService } from './auth.service';
import { IS_PUBLIC_RESOURCE_KEY } from '@/common/constant/public.decorator';
import { UsersService } from '@/modules/users/users.service';
import { OidcService } from '@/modules/auth/oidc.service';
import { TypedConfigService } from '@/config/typed-config.service';
import { NodeEnv } from '@/config/env';

@Injectable()
export class HybridAuthGuard implements CanActivate {
    private readonly logger = new Logger(HybridAuthGuard.name);
    private readonly isProduction: boolean;

    constructor(
        private authGuard: AuthService,
        private readonly reflector: Reflector,
        private readonly usersService: UsersService,
        private readonly oidcService: OidcService,
        private readonly configService: TypedConfigService,
    ) {
        this.isProduction = this.configService.get('NODE_ENV') === NodeEnv.Production;
    }

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
     * Cookie strategy handles silent refresh on expiry using the refresh_token cookie.
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

        if (!sessionInCookie && !sessionInHeader) {
            throw new UnauthorizedException('No authentication credentials provided.');
        }

        if (sessionInCookie && sessionInHeader) {
            throw new ForbiddenException('Multiple authentication methods provided. Please use only one.');
        }

        let accessToken: string | undefined;

        if (sessionInCookie) {
            accessToken = sessionInCookie;
        } else {
            accessToken = request.headers['authorization']?.substring(7);
        }

        if (!accessToken?.trim()) {
            throw new UnauthorizedException('Empty authentication token.');
        }

        const tokenStrategy = sessionInCookie ? 'cookie' : 'header';

        try {
            const payload = await this.authGuard.verify(accessToken, tokenStrategy);

            const givenName = typeof payload['given_name'] === 'string' ? payload['given_name'] : '';
            const familyName = typeof payload['family_name'] === 'string' ? payload['family_name'] : '';
            const email = typeof payload['email'] === 'string' ? payload['email'] : undefined;

            request.user = await this.usersService.syncFromToken({
                keycloakId: payload.sub!,
                fullName: `${givenName} ${familyName}`.trim(),
                email,
            });

            return true;
        } catch (error) {
            if (error instanceof errors.JWTExpired && tokenStrategy === 'cookie') {
                return this.handleCookieRefresh(request, context);
            } else if (error instanceof HttpException) {
                throw error;
            }

            throw new InternalServerErrorException(
                new Error(`Unhandled error token ${tokenStrategy} strategy`, { cause: error }),
            );
        }
    }

    private async handleCookieRefresh(request: FastifyRequest, context: ExecutionContext): Promise<boolean> {
        const refreshToken = request.cookies?.refresh_token;
        if (!refreshToken) {
            throw new UnauthorizedException('Access token expired and no refresh token available.');
        }

        try {
            const tokens = await this.oidcService.refreshToken(refreshToken);
            const newAccessToken = tokens.access_token;
            const newRefreshToken = tokens.refresh_token;

            if (!newAccessToken) {
                throw new UnauthorizedException('Token refresh failed.');
            }

            // Set new cookies on the response
            const reply = context.switchToHttp().getResponse<FastifyReply>();

            reply.setCookie('access_token', newAccessToken, {
                httpOnly: true,
                secure: this.isProduction,
                sameSite: 'lax',
                path: '/',
                maxAge: 15 * 60,
            });

            if (newRefreshToken) {
                reply.setCookie('refresh_token', newRefreshToken, {
                    httpOnly: true,
                    secure: this.isProduction,
                    sameSite: 'strict',
                    path: '/api/v1/auth',
                    maxAge: 24 * 60 * 60,
                });
            }

            // Verify the new access token and sync user
            const payload = await this.authGuard.verify(newAccessToken, 'cookie');

            const givenName = typeof payload['given_name'] === 'string' ? payload['given_name'] : '';
            const familyName = typeof payload['family_name'] === 'string' ? payload['family_name'] : '';
            const email = typeof payload['email'] === 'string' ? payload['email'] : undefined;

            request.user = await this.usersService.syncFromToken({
                keycloakId: payload.sub!,
                fullName: `${givenName} ${familyName}`.trim(),
                email,
            });

            // Update the cookie on the request so downstream handlers (like /auth/me) see the new token
            request.cookies.access_token = newAccessToken;

            this.logger.debug(`Silently refreshed access token for user ${payload.sub}`);
            return true;
        } catch (refreshError) {
            this.logger.warn('Silent token refresh failed', refreshError);
            throw new UnauthorizedException('Session expired. Please log in again.');
        }
    }
}
