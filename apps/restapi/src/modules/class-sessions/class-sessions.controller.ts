import { Body, Controller, Get, Headers, HttpCode, Param, ParseUUIDPipe, Post, Put, Query } from '@nestjs/common';
import type { User } from '@/infra/database/pg/schemas/schema';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { ClassSessionsService } from './class-sessions.service';
import { ListSessionsQueryDto, MoveSessionDto } from './dto/session.dtos';

// TODO(RBAC): mover/cancelar → ADMIN/STAFF (trainer solo su sesión, lectura).
// Roster y booking (/class-sessions/:id/reservations) viven en el módulo de reservas.
@Controller('class-sessions')
export class ClassSessionsController {
    constructor(private readonly sessions: ClassSessionsService) {}

    @Get()
    async list(@Query() query: ListSessionsQueryDto, @CurrentUser() user: User) {
        return this.sessions.list(query, user.id);
    }

    @Get(':id')
    async detail(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
        return this.sessions.detail(id, user.id);
    }

    @Put(':id/schedule')
    async move(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: MoveSessionDto,
        @CurrentUser() user: User,
        @Headers('if-match') ifMatch?: string,
    ) {
        return this.sessions.move(id, dto, user.id, ifMatch);
    }

    @Post(':id/cancel')
    @HttpCode(200)
    async cancel(
        @Param('id', ParseUUIDPipe) id: string,
        @CurrentUser() user: User,
        @Headers('if-match') ifMatch?: string,
    ) {
        return this.sessions.cancel(id, user.id, ifMatch);
    }
}
