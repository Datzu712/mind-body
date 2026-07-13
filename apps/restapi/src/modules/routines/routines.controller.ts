import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';

import { CurrentUser } from '@/common/decorators/current-user.decorator';
import type { User } from '@/infra/database/pg/schemas/schema';
import { RoutinesService } from './routines.service';
import { CreateRoutineDto } from './dto/create-routine.dto';
import { UpdateRoutineDto } from './dto/update-routine.dto';
import { AssignRoutineDto } from './dto/assign-routine.dto';

@Controller({ version: '1', path: 'routines' })
export class RoutinesController {
    constructor(private readonly routinesService: RoutinesService) {}

    @Get()
    async findAll(@CurrentUser() user: User, @Query('scope') scope?: string) {
        const isTrainer = await this.routinesService.isTrainer(user.id);
        if (isTrainer && scope !== 'member') return this.routinesService.findTrainerRoutines(user.id);
        return this.routinesService.findAssignedRoutines(user.id);
    }

    @Get(':id/members')
    async members(@CurrentUser() user: User, @Param('id') id: string) {
        return this.routinesService.findRoutineMembers(user.id, id);
    }

    @Get(':id/sessions')
    async sessions(@CurrentUser() user: User, @Param('id') id: string) {
        return this.routinesService.findRoutineSessions(user.id, id);
    }

    @Get(':id/versions')
    async versions(@CurrentUser() user: User, @Param('id') id: string) {
        return this.routinesService.findRoutineVersions(user.id, id);
    }

    @Get(':id')
    async findOne(@CurrentUser() user: User, @Param('id') id: string, @Query('scope') scope?: string) {
        const isTrainer = await this.routinesService.isTrainer(user.id);
        if (isTrainer && scope !== 'member') return this.routinesService.findRoutineDetailForTrainer(user.id, id);
        return this.routinesService.findRoutineDetail(user.id, id);
    }

    @Post()
    async create(@CurrentUser() user: User, @Body() dto: CreateRoutineDto) {
        return this.routinesService.createRoutine(user.id, dto);
    }

    @Put(':id')
    async update(@CurrentUser() user: User, @Param('id') id: string, @Body() dto: UpdateRoutineDto) {
        return this.routinesService.updateRoutine(user.id, id, dto);
    }

    @Delete(':id')
    async remove(@CurrentUser() user: User, @Param('id') id: string) {
        return this.routinesService.deleteRoutine(user.id, id);
    }

    @Post(':id/assign')
    async assign(@CurrentUser() user: User, @Param('id') id: string, @Body() dto: AssignRoutineDto) {
        return this.routinesService.assignRoutine(user.id, id, dto);
    }
}
