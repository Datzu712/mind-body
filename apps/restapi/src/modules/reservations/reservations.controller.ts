import { Body, Controller, Get, HttpCode, Param, ParseUUIDPipe, Post, Put, Query } from '@nestjs/common';
import type { User } from '@/infra/database/pg/schemas/schema';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { CurrentActor } from '@/common/decorators/current-actor.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { MANAGEMENT_ROLES, OWNER_OR_MANAGEMENT_ROLES, Role } from '@/common/constant/roles.constant';
import type { Actor } from '@/common/auth/actor';
import { ReservationsService } from './reservations.service';
import {
    AdminCancelReservationDto,
    ListMyReservationsQueryDto,
    MarkAttendanceDto,
    RescheduleReservationDto,
} from './dto/reservation.dtos';

// Asistencia → ADMIN/STAFF (default de clase, así un endpoint nuevo sin
// decorador queda cerrado). El TRAINER no toca reservas.
@Roles(...MANAGEMENT_ROLES)
@Controller('reservations')
export class ReservationsController {
    constructor(private readonly reservations: ReservationsService) {}

    @Roles(Role.MEMBER)
    @Get('me')
    async listMine(@Query() query: ListMyReservationsQueryDto, @CurrentUser() user: User) {
        return this.reservations.listMine(query, user.id);
    }

    @Roles(...OWNER_OR_MANAGEMENT_ROLES)
    @Get(':id/reschedule-options')
    async rescheduleOptions(@Param('id', ParseUUIDPipe) id: string, @CurrentActor() actor: Actor) {
        return this.reservations.rescheduleOptions(id, actor);
    }

    /** Owner sin body; ADMIN/STAFF con `{reason, note?}` (intención explícita). */
    @Roles(...OWNER_OR_MANAGEMENT_ROLES)
    @Post(':id/cancel')
    @HttpCode(200)
    async cancel(
        @Param('id', ParseUUIDPipe) id: string,
        @CurrentActor() actor: Actor,
        @Body() dto?: AdminCancelReservationDto,
    ) {
        return this.reservations.cancel(id, dto, actor);
    }

    @Roles(...OWNER_OR_MANAGEMENT_ROLES)
    @Post(':id/reschedule')
    @HttpCode(200)
    async reschedule(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: RescheduleReservationDto,
        @CurrentActor() actor: Actor,
    ) {
        return this.reservations.reschedule(id, dto, actor);
    }

    @Put(':id/attendance')
    async markAttendance(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: MarkAttendanceDto,
        @CurrentUser() user: User,
    ) {
        return this.reservations.markAttendance(id, dto, user.id);
    }
}
