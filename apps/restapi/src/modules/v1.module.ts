import { Module } from '@nestjs/common';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { AgentModule } from './agent/agent.module';

@Module({
    imports: [HealthModule, AuthModule, UsersModule, AgentModule],
})
export class V1Module {}
