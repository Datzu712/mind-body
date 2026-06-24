import { Controller, Get, Param, Query } from '@nestjs/common';

import { MeasurementsService } from './measurements.service';

/**
 * Read-only measurement endpoints scoped to an arbitrary member, for the dashboard
 * (trainers/staff/admins viewing a member's profile). Authentication is enforced by the
 * global HybridAuthGuard, matching `GET /users/:id`. The mobile self-scoped endpoints in
 * MeasurementsController remain untouched.
 */
@Controller({ version: '1', path: 'users/:id/measurements' })
export class MemberMeasurementsController {
    constructor(private readonly measurementsService: MeasurementsService) {}

    @Get()
    async findAll(@Param('id') id: string, @Query('from') from?: string, @Query('to') to?: string) {
        return this.measurementsService.findAll(id, from, to);
    }

    @Get('summary')
    async getSummary(@Param('id') id: string) {
        return this.measurementsService.getSummary(id);
    }
}
