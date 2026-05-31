import { createRemoteJWKSet, jwtVerify } from 'jose';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { TypedConfigService } from '@/config/typed-config.service';

@Injectable()
export class AuthService {
    private readonly expectedAudiences: string[];
    private readonly baseKCUrl: string;
    private readonly jwks: ReturnType<typeof createRemoteJWKSet>;

    constructor(private readonly configService: TypedConfigService) {
        this.baseKCUrl = `${this.configService.getOrThrow('KC_BASE_URL')}/realms/${this.configService.getOrThrow('KC_REALM')}`;

        this.jwks = createRemoteJWKSet(new URL(`${this.baseKCUrl}/protocol/openid-connect/certs`));

        this.expectedAudiences = [configService.getOrThrow('KC_REST_API_AUDIENCE')];
    }

    async verify(token: string, type: 'cookie' | 'header') {
        let expectedAzp: string;

        if (type === 'cookie') {
            expectedAzp = this.configService.getOrThrow('KC_ADMIN_CLIENT_ID');
        } else {
            expectedAzp = this.configService.getOrThrow('KC_MOBILE_CLIENT_ID');
        }

        const { payload } = await jwtVerify(token, this.jwks, {
            issuer: this.baseKCUrl,
            audience: this.expectedAudiences,
        });

        if (payload.azp !== expectedAzp) {
            throw new UnauthorizedException(`Invalid token: azp claim does not match expected client ID`);
        }

        return payload;
    }
}
