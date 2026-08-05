import { Module } from '@nestjs/common';

import { ClockModule } from '@/common/clock/clock.module';
import { MembershipsController } from './memberships.controller';
import { MembershipsService } from './memberships.service';

/** Memberships: history, renewal and cancellation of a lapsed term. */
@Module({
    imports: [ClockModule],
    controllers: [MembershipsController],
    providers: [MembershipsService],
    exports: [MembershipsService],
})
export class MembershipsModule {}
