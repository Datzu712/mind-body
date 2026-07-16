import { Body, Controller, Get, HttpCode, Param, ParseUUIDPipe, Post, Put, Query } from '@nestjs/common';
import type { User } from '@/infra/database/pg/schemas/schema';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { ReservationsService } from './reservations.service';
import {
    AdminCancelReservationDto,
    ListMyReservationsQueryDto,
    MarkAttendanceDto,
    RescheduleReservationDto,
} from './dto/reservation.dtos';

// TODO(RBAC): attendance → ADMIN/STAFF; cancel/reschedule → owner o
// ADMIN/STAFF; /me → MEMBER.
@Controller('reservations')
export class ReservationsController {
    constructor(private readonly reservations: ReservationsService) {}

    @Get('me')
    async listMine(@Query() query: ListMyReservationsQueryDto, @CurrentUser() user: User) {
        return this.reservations.listMine(query, user.id);
    }

    @Get(':id/reschedule-options')
    async rescheduleOptions(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
        return this.reservations.rescheduleOptions(id, user.id);
    }

    /** Owner sin body; ADMIN/STAFF con `{reason, note?}` (intención explícita). */
    @Post(':id/cancel')
    @HttpCode(200)
    async cancel(
        @Param('id', ParseUUIDPipe) id: string,
        @CurrentUser() user: User,
        @Body() dto?: AdminCancelReservationDto,
    ) {
        return this.reservations.cancel(id, dto, user.id);
    }

    @Post(':id/reschedule')
    @HttpCode(200)
    async reschedule(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: RescheduleReservationDto,
        @CurrentUser() user: User,
    ) {
        return this.reservations.reschedule(id, dto, user.id);
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
