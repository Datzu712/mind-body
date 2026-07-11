import { Module } from '@nestjs/common';
import { MeasurementsController } from './measurements.controller';
import { MemberMeasurementsController } from './member-measurements.controller';
import { MeasurementsService } from './measurements.service';

@Module({
    controllers: [MeasurementsController, MemberMeasurementsController],
    providers: [MeasurementsService],
    exports: [MeasurementsService],
})
export class MeasurementsModule {}
