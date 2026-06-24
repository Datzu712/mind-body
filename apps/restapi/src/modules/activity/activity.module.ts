import { Module } from '@nestjs/common';
import { ActivityController } from './activity.controller';
import { MemberActivityController } from './member-activity.controller';
import { ActivityService } from './activity.service';

@Module({
    controllers: [ActivityController, MemberActivityController],
    providers: [ActivityService],
    exports: [ActivityService],
})
export class ActivityModule {}
