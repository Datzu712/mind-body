import { Controller, Get, Query } from '@nestjs/common';

import { Roles } from '@/common/decorators/roles.decorator';
import { DASHBOARD_ROLES } from '@/common/constant/roles.constant';
import { StatsService } from './stats.service';
import { PopularClassesQueryDto, RecentReservationsQueryDto, ReservationsTrendQueryDto } from './dto/stats-query.dto';

/** Aggregates for the dashboard home. Read-only, dashboard roles only. */
@Roles(...DASHBOARD_ROLES)
@Controller({ version: '1', path: 'stats' })
export class StatsController {
    constructor(private readonly statsService: StatsService) {}

    @Get('overview')
    async getOverview() {
        return this.statsService.getOverview();
    }

    @Get('reservations-trend')
    async getReservationsTrend(@Query() query: ReservationsTrendQueryDto) {
        return this.statsService.getReservationsTrend(query.weeks);
    }

    @Get('popular-classes')
    async getPopularClasses(@Query() query: PopularClassesQueryDto) {
        return this.statsService.getPopularClasses(query.limit, query.days);
    }

    @Get('recent-reservations')
    async getRecentReservations(@Query() query: RecentReservationsQueryDto) {
        return this.statsService.getRecentReservations(query.limit);
    }
}
