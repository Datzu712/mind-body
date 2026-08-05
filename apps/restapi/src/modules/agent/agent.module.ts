import { Module } from '@nestjs/common';

import { ClockModule } from '@/common/clock/clock.module';
import { MeasurementsModule } from '@/modules/measurements/measurements.module';
import { ActivityModule } from '@/modules/activity/activity.module';
import { ReservationsModule } from '@/modules/reservations/reservations.module';
import { ClassSessionsModule } from '@/modules/class-sessions/class-sessions.module';
import { ExercisesModule } from '@/modules/exercises/exercises.module';
import { RoutinesModule } from '@/modules/routines/routines.module';
import { AgentController } from './agent.controller';
import { AgentService } from './agent.service';

@Module({
    imports: [
        ClockModule,
        MeasurementsModule,
        ActivityModule,
        ReservationsModule,
        ClassSessionsModule,
        ExercisesModule,
        RoutinesModule,
    ],
    controllers: [AgentController],
    providers: [AgentService],
})
export class AgentModule {}
