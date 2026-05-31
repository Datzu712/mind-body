import { HybridAuthGuard } from '@/modules/auth/guards/hybrid-auth.guard';
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { KeycloakAdminService } from '@/infra/keycloak/keycloak-admin.service';
import { AuthService } from '@/modules/auth/guards/auth.service';
import { AuthController } from './auth.controller';

@Module({
    controllers: [AuthController],
    providers: [
        KeycloakAdminService,
        AuthService,
        {
            provide: APP_GUARD,
            useClass: HybridAuthGuard,
        },
    ],
    exports: [KeycloakAdminService, AuthService],
})
export class AuthModule {}
