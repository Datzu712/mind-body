import { Module } from '@nestjs/common';

import { ClockModule } from '@/common/clock/clock.module';
import { MeasurementsModule } from '@/modules/measurements/measurements.module';
import { ActivityModule } from '@/modules/activity/activity.module';
import { ReservationsModule } from '@/modules/reservations/reservations.module';
import { ClassSessionsModule } from '@/modules/class-sessions/class-sessions.module';
import { AgentController } from './agent.controller';
import { AgentService } from './agent.service';

@Module({
    imports: [ClockModule, MeasurementsModule, ActivityModule, ReservationsModule, ClassSessionsModule],
    controllers: [AgentController],
    providers: [AgentService],
})
export class AgentModule {}
