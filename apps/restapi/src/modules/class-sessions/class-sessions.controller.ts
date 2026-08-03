import { Body, Controller, Get, Headers, HttpCode, Param, ParseUUIDPipe, Post, Put, Query } from '@nestjs/common';
import type { User } from '@/infra/database/pg/schemas/schema';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { CurrentActor } from '@/common/decorators/current-actor.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { APP_ROLES, MANAGEMENT_ROLES } from '@/common/constant/roles.constant';
import type { Actor } from '@/common/auth/actor';
import { ClassSessionsService } from './class-sessions.service';
import { ListSessionsQueryDto, MoveSessionDto } from './dto/session.dtos';

// Mover/cancelar → ADMIN/STAFF (default de clase: un endpoint nuevo sin
// decorador queda cerrado). La lectura del calendario la consume también mobile
// (MEMBER) para reservar, así que declara APP_ROLES; al TRAINER sin rol de
// gestión el service le recorta la vista a su propia agenda.
// Roster y booking (/class-sessions/:id/reservations) viven en el módulo de reservas.
@Roles(...MANAGEMENT_ROLES)
@Controller('class-sessions')
export class ClassSessionsController {
    constructor(private readonly sessions: ClassSessionsService) {}

    @Roles(...APP_ROLES)
    @Get()
    async list(@Query() query: ListSessionsQueryDto, @CurrentActor() actor: Actor) {
        return this.sessions.list(query, actor);
    }

    @Roles(...APP_ROLES)
    @Get(':id')
    async detail(@Param('id', ParseUUIDPipe) id: string, @CurrentActor() actor: Actor) {
        return this.sessions.detail(id, actor);
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
