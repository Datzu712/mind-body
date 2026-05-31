import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';
import { AuthModule } from '../auth/auth.module';
import { KeycloakModule } from '@/infra/keycloak/keycloak.module';

@Module({
    imports: [AuthModule, KeycloakModule],
    controllers: [HealthController],
    providers: [HealthService],
})
export class HealthModule {}
