import { createRemoteJWKSet, jwtVerify } from 'jose';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { TypedConfigService } from '@/config/typed-config.service';

@Injectable()
export class AuthService {
    private readonly baseKCUrl: string;
    private readonly jwks: ReturnType<typeof createRemoteJWKSet>;

    private readonly mobileAudience: string;
    private readonly dashboardAudience: string;
    private readonly mobileAzp: string;
    private readonly dashboardAzp: string;

    constructor(private readonly configService: TypedConfigService) {
        this.baseKCUrl = `${this.configService.getOrThrow('KC_BASE_URL')}/realms/${this.configService.getOrThrow('KC_REALM')}`;
        this.jwks = createRemoteJWKSet(new URL(`${this.baseKCUrl}/protocol/openid-connect/certs`));

        this.mobileAudience = configService.getOrThrow('KC_REST_API_AUDIENCE');
        this.dashboardAudience = configService.getOrThrow('KC_DASHBOARD_AUDIENCE');
        this.mobileAzp = configService.getOrThrow('KC_MOBILE_CLIENT_ID');
        this.dashboardAzp = configService.getOrThrow('KC_ADMIN_CLIENT_ID');
    }

    async verify(token: string, type: 'cookie' | 'header') {
        const expectedAudience = type === 'cookie' ? this.dashboardAudience : this.mobileAudience;
        const expectedAzp = type === 'cookie' ? this.dashboardAzp : this.mobileAzp;

        const { payload } = await jwtVerify(token, this.jwks, {
            issuer: this.baseKCUrl,
            audience: expectedAudience,
        });

        if (payload.azp !== expectedAzp) {
            throw new UnauthorizedException('Invalid token: azp claim does not match expected client ID');
        }

        return payload;
    }
}
