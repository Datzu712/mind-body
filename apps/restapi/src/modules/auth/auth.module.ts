import { HybridAuthGuard } from '@/modules/auth/guards/hybrid-auth.guard';
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AuthService } from '@/modules/auth/guards/auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '@/modules/users/users.module';
import { KeycloakModule } from '@/infra/keycloak/keycloak.module';

@Module({
    imports: [UsersModule, KeycloakModule],
    controllers: [AuthController],
    providers: [
        AuthService,
        {
            provide: APP_GUARD,
            useClass: HybridAuthGuard,
        },
    ],
    exports: [AuthService],
})
export class AuthModule {}
