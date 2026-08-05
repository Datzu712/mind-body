import { Module } from '@nestjs/common';

import { ClockModule } from '@/common/clock/clock.module';
import { StatsController } from './stats.controller';
import { StatsService } from './stats.service';

@Module({
    imports: [ClockModule],
    controllers: [StatsController],
    providers: [StatsService],
})
export class StatsModule {}
