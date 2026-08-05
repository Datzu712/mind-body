import { Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Patch, Post, Put, Query } from '@nestjs/common';

import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { DASHBOARD_ROLES, Role } from '@/common/constant/roles.constant';
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

/**
 * Routine builder. Designing a routine is a trainer's job and ADMIN/STAFF run the
 * gym, so all three both read and write here — the read = DASHBOARD /
 * write = MANAGEMENT split that `users` and `memberships` use would lock out the
 * one role this module exists for.
 *
 * The class-level default is the constant — at this level it only has to mean
 * "not MEMBER", so an endpoint added without a decorator stays closed. Handlers
 * spell their roles out instead: there the set IS the business rule, and reading
 * it should not require opening another file.
 *
 * A handler-level `@Roles` REPLACES the class one — the guard uses
 * `getAllAndOverride`, not merge — which is how the `mine` routes open to MEMBER
 * only.
 */
@Roles(...DASHBOARD_ROLES)
@Controller('routines')
export class RoutinesController {
    constructor(private readonly routines: RoutinesService) {}

    @Get()
    async list(@Query() query: ListRoutinesQueryDto) {
        return this.routines.list(query);
    }

    /** Self-service de mobile: el user autenticado solo puede verse a sí mismo. */
    @Roles(Role.MEMBER)
    @Get('mine')
    async mine(@CurrentUser() user: User) {
        return this.routines.listMine(user.id);
    }

    /** Elegir cuál rutina muestra el home. Solo sobre las asignaciones propias. */
    @Roles(Role.MEMBER)
    @Patch('mine/:id/focus')
    @HttpCode(204)
    async focusMine(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
        await this.routines.focusMine(user.id, id);
    }

    /** Sacar una rutina del plan propio. Cierra la asignación, no borra la rutina. */
    @Roles(Role.MEMBER)
    @Delete('mine/:id')
    @HttpCode(204)
    async removeMine(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
        await this.routines.removeMine(user.id, id);
    }

    @Roles(Role.TRAINER, Role.ADMIN, Role.STAFF)
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

    /** Miembros con la rutina asignada: la confirmación visible de un assign. */
    @Get(':id/members')
    async assignedMembers(@Param('id', ParseUUIDPipe) id: string) {
        return this.routines.listAssignedMembers(id);
    }

    @Post(':id/assign')
    @HttpCode(204)
    async assign(@Param('id', ParseUUIDPipe) id: string, @Body() dto: AssignRoutineDto, @CurrentUser() user: User) {
        await this.routines.assign(id, dto.memberId, user.id);
    }
}
