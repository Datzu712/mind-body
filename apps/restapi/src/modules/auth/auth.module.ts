import { HybridAuthGuard } from '@/modules/auth/guards/hybrid-auth.guard';
import { RolesGuard } from '@/modules/auth/guards/roles.guard';
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AuthService } from '@/modules/auth/guards/auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '@/modules/users/users.module';
import { KeycloakModule } from '@/infra/keycloak/keycloak.module';
import { OidcService } from './oidc.service';

@Module({
    imports: [UsersModule, KeycloakModule],
    controllers: [AuthController],
    providers: [
        AuthService,
        OidcService,
        {
            provide: APP_GUARD,
            useClass: HybridAuthGuard,
        },
        {
            // Runs after HybridAuthGuard (registration order), which populates request.roles
            provide: APP_GUARD,
            useClass: RolesGuard,
        },
    ],
    exports: [AuthService, OidcService],
})
export class AuthModule {}
