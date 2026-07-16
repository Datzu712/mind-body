import { Controller, Get, Param, ParseUUIDPipe, Post, Res } from '@nestjs/common';
import type { FastifyReply } from 'fastify';
import type { User } from '@/infra/database/pg/schemas/schema';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { ReservationsService } from './reservations.service';

/**
 * Reservas anidadas bajo /class-sessions/:id. Viven en el módulo de reservas
 * (roster y booking son operaciones de este dominio); la ruta se conserva por
 * compatibilidad con dashboard y mobile.
 */
// TODO(RBAC): roster → ADMIN/STAFF (trainer solo su sesión, lectura); booking → MEMBER self.
@Controller('class-sessions')
export class SessionReservationsController {
    constructor(private readonly reservations: ReservationsService) {}

    @Get(':id/reservations')
    async roster(@Param('id', ParseUUIDPipe) id: string) {
        return this.reservations.roster(id);
    }

    /** Booking self-scoped sin body: 201 si creó, 200 si recuperó un retry idéntico. */
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
