import { Body, Controller, Get, Post, Query } from '@nestjs/common';

import { CurrentUser } from '@/common/decorators/current-user.decorator';
import type { User } from '@/infra/database/pg/schemas/schema';
import { MeasurementsService } from './measurements.service';
import { CreateMeasurementDto } from './dto/create-measurement.dto';

@Controller({ version: '1', path: 'measurements' })
export class MeasurementsController {
    constructor(private readonly measurementsService: MeasurementsService) {}

    @Post()
    async create(@CurrentUser() user: User, @Body() dto: CreateMeasurementDto) {
        return this.measurementsService.create(user.id, dto);
    }

    @Get()
    async findAll(@CurrentUser() user: User, @Query('from') from?: string, @Query('to') to?: string) {
        return this.measurementsService.findAll(user.id, from, to);
    }

    @Get('summary')
    async getSummary(@CurrentUser() user: User) {
        return this.measurementsService.getSummary(user.id);
    }
}
