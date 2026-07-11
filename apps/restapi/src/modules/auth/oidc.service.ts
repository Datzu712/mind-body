import { Injectable, OnModuleInit } from '@nestjs/common';
import * as client from 'openid-client';
import { TypedConfigService } from '@/config/typed-config.service';
import { NodeEnv } from '@/config/env';

@Injectable()
export class OidcService implements OnModuleInit {
    private config!: client.Configuration;

    private isProduction = false;

    constructor(private readonly configService: TypedConfigService) {}

    async onModuleInit() {
        const kcBaseUrl = this.configService.getOrThrow('KC_BASE_URL');
        const realm = this.configService.getOrThrow('KC_REALM');
        const clientId = this.configService.getOrThrow('KC_ADMIN_CLIENT_ID');
        const clientSecret = this.configService.getOrThrow('KC_ADMIN_CLIENT_SECRET');

        const issuerUrl = new URL(`${kcBaseUrl}/realms/${realm}`);

        this.isProduction = this.configService.getOrThrow('NODE_ENV') === NodeEnv.Production;

        this.config = await client.discovery(
            issuerUrl,
            clientId,
            clientSecret,
            client.ClientSecretPost(clientSecret),
            !this.isProduction
                ? {
                      execute: [client.allowInsecureRequests],
                  }
                : undefined,
        );
    }

    generatePKCE(): { codeVerifier: string; codeChallenge: Promise<string> } {
        const codeVerifier = client.randomPKCECodeVerifier();
        return {
            codeVerifier,
            codeChallenge: client.calculatePKCECodeChallenge(codeVerifier),
        };
    }

    buildAuthorizationUrl(params: { redirectUri: string; state: string; codeChallenge: string; scope?: string }): URL {
        return client.buildAuthorizationUrl(this.config, {
            redirect_uri: params.redirectUri,
            scope: params.scope ?? 'openid profile email',
            state: params.state,
            code_challenge: params.codeChallenge,
            code_challenge_method: 'S256',
        });
    }

    async exchangeCode(
        callbackUrl: URL,
        checks: { expectedState: string; pkceCodeVerifier: string },
    ): Promise<client.TokenEndpointResponse & client.TokenEndpointResponseHelpers> {
        return client.authorizationCodeGrant(this.config, callbackUrl, {
            expectedState: checks.expectedState,
            pkceCodeVerifier: checks.pkceCodeVerifier,
        });
    }

    async refreshToken(
        refreshToken: string,
    ): Promise<client.TokenEndpointResponse & client.TokenEndpointResponseHelpers> {
        return client.refreshTokenGrant(this.config, refreshToken);
    }
}
