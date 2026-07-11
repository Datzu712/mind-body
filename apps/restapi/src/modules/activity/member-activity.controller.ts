import { Controller, Get, Param, Query } from '@nestjs/common';

import { ActivityService } from './activity.service';

/**
 * Read-only activity endpoints scoped to an arbitrary member, for the dashboard
 * (trainers/staff/admins viewing a member's profile). Authentication is enforced by the
 * global HybridAuthGuard, matching `GET /users/:id`. The mobile self-scoped endpoints in
 * ActivityController remain untouched.
 */
@Controller({ version: '1', path: 'users/:id/activity' })
export class MemberActivityController {
    constructor(private readonly activityService: ActivityService) {}

    @Get('daily/range')
    async getDailyRange(@Param('id') id: string, @Query('from') from: string, @Query('to') to: string) {
        return this.activityService.getRange(id, from, to);
    }
}
