import { Body, Controller, Get, Put, Query } from '@nestjs/common';

import { CurrentUser } from '@/common/decorators/current-user.decorator';
import type { User } from '@/infra/database/pg/schemas/schema';
import { ActivityService } from './activity.service';
import { UpsertDailyActivityDto } from './dto/upsert-daily-activity.dto';
import { BatchDailyActivityDto } from './dto/batch-daily-activity.dto';

@Controller({ version: '1', path: 'activity' })
export class ActivityController {
    constructor(private readonly activityService: ActivityService) {}

    @Put('daily')
    async upsertDaily(@CurrentUser() user: User, @Body() dto: UpsertDailyActivityDto) {
        return this.activityService.upsert(user.id, dto);
    }

    @Put('daily/batch')
    async upsertBatch(@CurrentUser() user: User, @Body() dto: BatchDailyActivityDto) {
        return this.activityService.upsertBatch(user.id, dto.items);
    }

    @Get('daily')
    async getDaily(@CurrentUser() user: User, @Query('date') date: string) {
        return this.activityService.getByDate(user.id, date);
    }

    @Get('daily/range')
    async getDailyRange(@CurrentUser() user: User, @Query('from') from: string, @Query('to') to: string) {
        return this.activityService.getRange(user.id, from, to);
    }
}
