import { Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Post, Put, Query } from '@nestjs/common';

import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { type User } from '@/infra/database/pg/schemas/schema';
import { RoutinesService } from './routines.service';
import {
    AddRoutineExerciseDto,
    AssignRoutineDto,
    CreateRoutineDto,
    ListRoutinesQueryDto,
    ReorderRoutineExercisesDto,
    UpdateRoutineDto,
    UpdateRoutineExerciseDto,
} from './dto/routine.dtos';

@Controller('routines')
export class RoutinesController {
    constructor(private readonly routines: RoutinesService) {}

    @Get()
    async list(@Query() query: ListRoutinesQueryDto) {
        return this.routines.list(query);
    }

    @Get('mine')
    async mine(@CurrentUser() user: User) {
        return this.routines.listMine(user.id);
    }

    @Post()
    async create(@Body() dto: CreateRoutineDto, @CurrentUser() user: User) {
        return this.routines.create(dto, user.id);
    }

    @Get(':id')
    async detail(@Param('id', ParseUUIDPipe) id: string) {
        return this.routines.detail(id);
    }

    @Put(':id')
    async update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateRoutineDto) {
        return this.routines.update(id, dto);
    }

    @Delete(':id')
    @HttpCode(204)
    async remove(@Param('id', ParseUUIDPipe) id: string) {
        await this.routines.remove(id);
    }

    @Post(':id/exercises')
    async addExercise(@Param('id', ParseUUIDPipe) id: string, @Body() dto: AddRoutineExerciseDto) {
        return this.routines.addExercise(id, dto);
    }

    @Put(':id/exercises/:itemId')
    async updateExercise(
        @Param('id', ParseUUIDPipe) id: string,
        @Param('itemId', ParseUUIDPipe) itemId: string,
        @Body() dto: UpdateRoutineExerciseDto,
    ) {
        return this.routines.updateExercise(id, itemId, dto);
    }

    @Delete(':id/exercises/:itemId')
    async removeExercise(@Param('id', ParseUUIDPipe) id: string, @Param('itemId', ParseUUIDPipe) itemId: string) {
        return this.routines.removeExercise(id, itemId);
    }

    @Put(':id/exercises-order')
    async reorder(@Param('id', ParseUUIDPipe) id: string, @Body() dto: ReorderRoutineExercisesDto) {
        return this.routines.reorderExercises(id, dto.itemIds);
    }

    @Post(':id/assign')
    @HttpCode(204)
    async assign(@Param('id', ParseUUIDPipe) id: string, @Body() dto: AssignRoutineDto, @CurrentUser() user: User) {
        await this.routines.assign(id, dto.memberId, user.id);
    }
}
