import { Controller, Get, Post, Query, Res, Req, UnauthorizedException, Logger } from '@nestjs/common';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { randomBytes } from 'crypto';

import { Public } from '@/modules/auth/decorators/public-endpoint.decorator';
import { TypedConfigService } from '@/config/typed-config.service';
import { OidcService } from './oidc.service';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import type { User } from '@/infra/database/pg/schemas/schema';
import { NodeEnv } from '@/config/env';

const ALLOWED_ROLES = ['ADMIN', 'TRAINER', 'STAFF'];

interface OAuthStateCookie {
    codeVerifier: string;
    state: string;
    redirect: string;
}

interface JwtPayload {
    sub: string;
    realm_access?: { roles?: string[] };
}

@Controller({
    version: '1',
    path: 'auth',
})
export class AuthController {
    private readonly logger = new Logger(AuthController.name);
    private readonly dashboardUrl: string;
    private readonly callbackBaseUrl: string;
    private readonly isProduction: boolean;
    private readonly cookieOpts: {
        httpOnly: boolean;
        path: string;
        sameSite: 'none' | 'lax';
        secure: boolean;
    };

    constructor(
        private readonly oidcService: OidcService,
        private readonly configService: TypedConfigService,
    ) {
        this.dashboardUrl = this.configService.getOrThrow('DASHBOARD_URL');
        // With a static dashboard (Cloudflare Pages) there is no /api proxy, so
        // the OIDC callback must land on the API's own public URL; in dev the
        // Vite proxy makes DASHBOARD_URL work for both.
        this.callbackBaseUrl = this.configService.get('API_PUBLIC_URL') || this.dashboardUrl;
        this.isProduction = this.configService.get('NODE_ENV') === NodeEnv.Production;
        // SameSite=None (mandatory with Secure) so the static dashboard hosted
        // on another site (Cloudflare Pages) can send the session cookies
        // cross-site. Dev runs over http behind the Vite proxy → Lax.
        this.cookieOpts = {
            httpOnly: true,
            path: '/',
            sameSite: this.isProduction ? ('none' as const) : ('lax' as const),
            secure: this.isProduction,
        };
    }

    @Public()
    @Get('login')
    async login(@Query('redirect') redirect: string | undefined, @Res() reply: FastifyReply) {
        const redirectPath = redirect?.trim() ? redirect : '/dashboard';

        const { codeVerifier, codeChallenge } = this.oidcService.generatePKCE();
        const state = randomBytes(16).toString('hex');

        const stateCookie: OAuthStateCookie = {
            codeVerifier,
            state,
            redirect: redirectPath,
        };

        reply.setCookie('oauth_state', Buffer.from(JSON.stringify(stateCookie)).toString('base64'), {
            ...this.cookieOpts,
            maxAge: 300, // 5 minutes — enough for the auth flow
            path: '/api/v1/auth',
        });

        const authUrl = this.oidcService.buildAuthorizationUrl({
            redirectUri: `${this.callbackBaseUrl}/api/v1/auth/callback`,
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

        // Reconstruct the callback URL (must match the redirect_uri sent to KC)
        const callbackUrl = new URL(`${this.callbackBaseUrl}${request.url}`);

        const tokens = await this.oidcService.exchangeCode(callbackUrl, {
            expectedState: stateCookie.state,
            pkceCodeVerifier: stateCookie.codeVerifier,
        });

        const accessToken = tokens.access_token;
        const refreshToken = tokens.refresh_token;

        if (!accessToken || !refreshToken) {
            throw new UnauthorizedException('Token exchange failed — missing tokens.');
        }

        // Decode the access token to get the user's roles
        const tokenParts = accessToken.split('.');
        if (!tokenParts[1]) {
            throw new UnauthorizedException('Invalid access token format.');
        }
        const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString('utf8')) as JwtPayload;

        const sub = payload.sub;
        const realmRoles = payload.realm_access?.roles ?? [];

        // Check if user has ALLOWED role
        const hasAllowedRole = realmRoles.some((role) => ALLOWED_ROLES.includes(role));

        if (!hasAllowedRole) {
            this.logger.warn(`User ${sub} denied dashboard access — roles: ${realmRoles.join(', ')}`);
            return reply.redirect(`${this.dashboardUrl}/auth/forbidden`, 302);
        }

        // Set auth cookies
        reply.setCookie('access_token', accessToken, {
            ...this.cookieOpts,
            maxAge: 15 * 60, // 15 minutes
        });

        reply.setCookie('refresh_token', refreshToken, {
            ...this.cookieOpts,
            maxAge: 24 * 60 * 60, // 1 day
            path: '/api/v1/auth',
        });

        return reply.redirect(`${this.dashboardUrl}${stateCookie.redirect}`, 302);
    }

    @Get('me')
    me(@CurrentUser() user: User, @Req() request: FastifyRequest) {
        const accessToken = request.cookies?.access_token;
        let roles: string[] = [];

        if (accessToken) {
            try {
                const payload = JSON.parse(
                    Buffer.from(accessToken.split('.')[1]!, 'base64').toString('utf8'),
                ) as JwtPayload;
                roles = (payload.realm_access?.roles ?? []).filter(
                    (r) => !r.startsWith('default-roles-') && r !== 'offline_access' && r !== 'uma_authorization',
                );
            } catch {
                // If decode fails, roles remain empty
            }
        }

        return {
            id: user.id,
            keycloakSubject: user.keycloakSubject,
            fullName: user.fullName,
            email: user.email,
            phone: user.phone,
            status: user.status,
            roles,
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
