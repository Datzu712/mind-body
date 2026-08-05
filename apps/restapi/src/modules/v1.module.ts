import { Module } from '@nestjs/common';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ActivityModule } from './activity/activity.module';
import { MeasurementsModule } from './measurements/measurements.module';
import { MembershipsModule } from './memberships/memberships.module';
import { TseModule } from './tse/tse.module';
import { ClassesModule } from './classes/classes.module';
import { ClassSessionsModule } from './class-sessions/class-sessions.module';
import { ReservationsModule } from './reservations/reservations.module';
import { AgentModule } from './agent/agent.module';
import { ExercisesModule } from './exercises/exercises.module';
import { RoutinesModule } from './routines/routines.module';
import { StatsModule } from './stats/stats.module';

@Module({
    imports: [
        HealthModule,
        AuthModule,
        UsersModule,
        ActivityModule,
        MeasurementsModule,
        MembershipsModule,
        TseModule,
        ClassesModule,
        ClassSessionsModule,
        ReservationsModule,
        AgentModule,
        ExercisesModule,
        RoutinesModule,
        StatsModule,
    ],
})
export class V1Module {}
