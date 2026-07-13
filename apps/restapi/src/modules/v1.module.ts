import { Module } from '@nestjs/common';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ActivityModule } from './activity/activity.module';
import { MeasurementsModule } from './measurements/measurements.module';
import { TseModule } from './tse/tse.module';
import { RoutinesModule } from './routines/routines.module';

@Module({
    imports: [HealthModule, AuthModule, UsersModule, ActivityModule, MeasurementsModule, TseModule, RoutinesModule],
})
export class V1Module {}
