import { Module } from '@nestjs/common';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ActivityModule } from './activity/activity.module';
import { MeasurementsModule } from './measurements/measurements.module';

@Module({
    imports: [HealthModule, AuthModule, UsersModule, ActivityModule, MeasurementsModule],
})
export class V1Module {}
