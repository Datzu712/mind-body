import { Module } from '@nestjs/common';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ActivityModule } from './activity/activity.module';

@Module({
    imports: [HealthModule, AuthModule, UsersModule, ActivityModule],
})
export class V1Module {}
