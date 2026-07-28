import { Controller, Get, Param, ParseUUIDPipe, Post, Res } from '@nestjs/common';
import type { FastifyReply } from 'fastify';
import type { User } from '@/infra/database/pg/schemas/schema';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { CurrentActor } from '@/common/decorators/current-actor.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { DASHBOARD_ROLES, MANAGEMENT_ROLES, Role } from '@/common/constant/roles.constant';
import type { Actor } from '@/common/auth/actor';
import { ReservationsService } from './reservations.service';

/**
 * Reservas anidadas bajo /class-sessions/:id. Viven en el módulo de reservas
 * (roster y booking son operaciones de este dominio); la ruta se conserva por
 * compatibilidad con dashboard y mobile.
 */
// Default de clase = gestión, así un endpoint nuevo sin decorador queda cerrado.
@Roles(...MANAGEMENT_ROLES)
@Controller('class-sessions')
export class SessionReservationsController {
    constructor(private readonly reservations: ReservationsService) {}

    /** Roster de gestión; el TRAINER solo lee el de sus propias sesiones. */
    @Roles(...DASHBOARD_ROLES)
    @Get(':id/reservations')
    async roster(@Param('id', ParseUUIDPipe) id: string, @CurrentActor() actor: Actor) {
        return this.reservations.roster(id, actor);
    }

    /** Booking self-scoped sin body: 201 si creó, 200 si recuperó un retry idéntico. */
    @Roles(Role.MEMBER)
    @Post(':id/reservations')
    async book(
        @Param('id', ParseUUIDPipe) id: string,
        @CurrentUser() user: User,
        @Res({ passthrough: true }) reply: FastifyReply,
    ) {
        const { result, created } = await this.reservations.book(id, user.id);
        void reply.status(created ? 201 : 200);
        return result;
    }
}
