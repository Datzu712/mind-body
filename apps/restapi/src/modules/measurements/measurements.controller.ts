import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Put, Query } from '@nestjs/common';

import { CurrentUser } from '@/common/decorators/current-user.decorator';
import type { User } from '@/infra/database/pg/schemas/schema';
import { MeasurementsService } from './measurements.service';
import { CreateMeasurementDto } from './dto/create-measurement.dto';
import { MeasurementValuesDto } from './dto/measurement-values.dto';

@Controller({ version: '1', path: 'measurements' })
export class MeasurementsController {
    constructor(private readonly measurementsService: MeasurementsService) {}

    @Post()
    async create(@CurrentUser() user: User, @Body() dto: CreateMeasurementDto) {
        return this.measurementsService.create(user.id, dto);
    }

    /**
     * PUT y no PATCH: el body trae los cinco valores y reemplaza, así no hay que
     * distinguir "campo ausente" de "campo en null". Solo el dueño de la medición,
     * y solo dentro de la ventana de corrección.
     */
    @Put(':id')
    async update(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string, @Body() dto: MeasurementValuesDto) {
        return this.measurementsService.update(user.id, id, dto);
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
