import { Module } from '@nestjs/common';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ActivityModule } from './activity/activity.module';
import { MeasurementsModule } from './measurements/measurements.module';
import { TseModule } from './tse/tse.module';
import { ClassesModule } from './classes/classes.module';
import { ClassSessionsModule } from './class-sessions/class-sessions.module';
import { ReservationsModule } from './reservations/reservations.module';
import { AgentModule } from './agent/agent.module';

@Module({
    imports: [
        HealthModule,
        AuthModule,
        UsersModule,
        ActivityModule,
        MeasurementsModule,
        TseModule,
        ClassesModule,
        ClassSessionsModule,
        ReservationsModule,
        AgentModule,
    ],
})
export class V1Module {}
