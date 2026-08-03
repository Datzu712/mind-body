import { Controller, Get, Post, Query, Res, Req, UnauthorizedException, Logger } from '@nestjs/common';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { randomBytes } from 'crypto';
import { decodeJwt } from 'jose';

import { Public } from '@/modules/auth/decorators/public-endpoint.decorator';
import { TypedConfigService } from '@/config/typed-config.service';
import { OidcService } from './oidc.service';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import type { User } from '@/infra/database/pg/schemas/schema';
import { NodeEnv } from '@/config/env';
import { DASHBOARD_ROLES, extractRealmRoles } from '@/common/constant/roles.constant';

const COOKIE_OPTS_BASE = {
    httpOnly: true,
    sameSite: 'lax' as const,
    path: '/',
};

interface OAuthStateCookie {
    codeVerifier: string;
    state: string;
    redirect: string;
}

@Controller({
    version: '1',
    path: 'auth',
})
export class AuthController {
    private readonly logger = new Logger(AuthController.name);
    private readonly dashboardUrl: string;
    private readonly isProduction: boolean;

    constructor(
        private readonly oidcService: OidcService,
        private readonly configService: TypedConfigService,
    ) {
        this.dashboardUrl = this.configService.getOrThrow('DASHBOARD_URL');
        this.isProduction = this.configService.get('NODE_ENV') === NodeEnv.Production;
    }

    @Public()
    @Get('login')
    async login(@Query('redirect') redirect: string | undefined, @Res() reply: FastifyReply) {
        const redirectPath = redirect || '/dashboard';

        const { codeVerifier, codeChallenge } = this.oidcService.generatePKCE();
        const state = randomBytes(16).toString('hex');

        const stateCookie: OAuthStateCookie = {
            codeVerifier,
            state,
            redirect: redirectPath,
        };

        reply.setCookie('oauth_state', Buffer.from(JSON.stringify(stateCookie)).toString('base64'), {
            ...COOKIE_OPTS_BASE,
            secure: this.isProduction,
            maxAge: 300, // 5 minutes — enough for the auth flow
            path: '/api/v1/auth',
        });

        // Callback goes through the dashboard's proxy so cookies stay on the same domain
        const authUrl = this.oidcService.buildAuthorizationUrl({
            redirectUri: `${this.dashboardUrl}/api/v1/auth/callback`,
            state,
            codeChallenge: await codeChallenge,
        });

        this.logger.debug(`Redirecting to OIDC provider for login, state: ${state}, redirectPath: ${redirectPath}`);

        return reply.redirect(authUrl.toString(), 302);
    }

    @Public()
    @Get('callback')
    async callback(@Req() request: FastifyRequest, @Res() reply: FastifyReply) {
        const stateCookieRaw = request.cookies?.oauth_state;
        if (!stateCookieRaw) {
            throw new UnauthorizedException('Missing OAuth state cookie. Please restart the login flow.');
        }

        let stateCookie: OAuthStateCookie;
        try {
            stateCookie = JSON.parse(Buffer.from(stateCookieRaw, 'base64').toString('utf8')) as OAuthStateCookie;
        } catch {
            throw new UnauthorizedException('Invalid OAuth state cookie.');
        }

        // Clear the temporary state cookie
        reply.clearCookie('oauth_state', { path: '/api/v1/auth' });

        // Reconstruct the callback URL using DASHBOARD_URL (must match the redirect_uri sent to KC)
        const callbackUrl = new URL(`${this.dashboardUrl}${request.url}`);

        const tokens = await this.oidcService.exchangeCode(callbackUrl, {
            expectedState: stateCookie.state,
            pkceCodeVerifier: stateCookie.codeVerifier,
        });

        const accessToken = tokens.access_token;
        const refreshToken = tokens.refresh_token;

        if (!accessToken || !refreshToken) {
            throw new UnauthorizedException('Token exchange failed — missing tokens.');
        }

        const payload = decodeJwt(accessToken);
        const realmRoles = extractRealmRoles(payload);

        const hasAllowedRole = DASHBOARD_ROLES.some((allowed) => realmRoles.includes(allowed));

        if (!hasAllowedRole) {
            this.logger.warn(`User ${payload.sub} denied dashboard access — roles: ${realmRoles.join(', ')}`);
            return reply.redirect(`${this.dashboardUrl}/auth/forbidden`, 302);
        }

        // Set auth cookies
        reply.setCookie('access_token', accessToken, {
            ...COOKIE_OPTS_BASE,
            secure: this.isProduction,
            maxAge: 15 * 60, // 15 minutes
        });

        reply.setCookie('refresh_token', refreshToken, {
            ...COOKIE_OPTS_BASE,
            secure: this.isProduction,
            sameSite: 'strict',
            maxAge: 24 * 60 * 60, // 1 day
            path: '/api/v1/auth',
        });

        return reply.redirect(`${this.dashboardUrl}${stateCookie.redirect}`, 302);
    }

    @Get('me')
    me(@CurrentUser() user: User, @Req() request: FastifyRequest) {
        return {
            id: user.id,
            keycloakSubject: user.keycloakSubject,
            fullName: user.fullName,
            email: user.email,
            phone: user.phone,
            status: user.status,
            roles: request.roles ?? [],
        };
    }

    @Post('logout')
    async logout(@Res() reply: FastifyReply) {
        reply.clearCookie('access_token', { path: '/' });
        reply.clearCookie('refresh_token', { path: '/api/v1/auth' });

        const kcBaseUrl = this.configService.getOrThrow('KC_BASE_URL');
        const realm = this.configService.getOrThrow('KC_REALM');
        const clientId = this.configService.getOrThrow('KC_ADMIN_CLIENT_ID');
        const logoutUrl = `${kcBaseUrl}/realms/${realm}/protocol/openid-connect/logout?post_logout_redirect_uri=${encodeURIComponent(this.dashboardUrl)}&client_id=${clientId}`;

        return reply.send({ logoutUrl });
    }
}
