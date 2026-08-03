import { Module } from '@nestjs/common';

import { ClockModule } from '@/common/clock/clock.module';
import { MeasurementsController } from './measurements.controller';
import { MemberMeasurementsController } from './member-measurements.controller';
import { MeasurementsService } from './measurements.service';

@Module({
    imports: [ClockModule],
    controllers: [MeasurementsController, MemberMeasurementsController],
    providers: [MeasurementsService],
    exports: [MeasurementsService],
})
export class MeasurementsModule {}
