import { Body, Controller, Delete, Get, HttpCode, Logger, Param, ParseUUIDPipe, Post, Res } from '@nestjs/common';
import type { FastifyReply } from 'fastify';

import { RoutinesForgeService } from './routines-forge.service';
import { ForgeChatDto } from './dto/forge-chat.dto';
import { Roles } from '@/common/decorators/roles.decorator';
import { DASHBOARD_ROLES } from '@/common/constant/roles.constant';
import { openSseStream } from '@/utils/sse';

/**
 * Forge writes to the routine through its tools, so it is gated exactly like
 * the REST builder in `RoutinesController`: dashboard roles only, never MEMBER.
 *
 * Anti-desync: el único lock es de UI (el dashboard deshabilita el builder
 * mientras este stream está activo). Edge cases CONOCIDOS y pospuestos:
 *  - Otra pestaña/dispositivo puede editar la rutina durante un turno de
 *    Forge (el lock de UI no aplica cross-tab).
 *  - Si el stream muere a mitad de turno, el cliente libera su lock local
 *    pero las tools ya ejecutadas quedan aplicadas (no hay rollback).
 * Solución futura: lock server-side en Redis con TTL por routineId que haga
 * responder 409 a los endpoints REST de edición mientras el turno corre.
 */
@Roles(...DASHBOARD_ROLES)
@Controller('routines')
export class RoutinesForgeController {
    private readonly logger = new Logger(RoutinesForgeController.name);

    constructor(private readonly forge: RoutinesForgeService) {}

    /** Hidrata el panel del chat tras un reload: lo visible = lo que Forge recuerda. */
    @Get(':id/forge/history')
    async history(@Param('id', ParseUUIDPipe) id: string) {
        return this.forge.getChatHistory(id);
    }

    /** "Reiniciar conversación": borra la memoria de Forge para esta rutina. */
    @Delete(':id/forge/history')
    @HttpCode(204)
    async clearHistory(@Param('id', ParseUUIDPipe) id: string) {
        await this.forge.clearChatHistory(id);
    }

    @Post(':id/forge')
    async chat(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: ForgeChatDto,
        @Res() reply: FastifyReply,
    ): Promise<void> {
        // 404 ANTES de hijackear: después del hijack ya no se puede responder con error HTTP.
        await this.forge.assertRoutineExists(id);

        openSseStream(reply);

        try {
            for await (const ev of this.forge.streamChat(id, dto.message)) {
                if (ev.type === 'draft-updated') {
                    reply.raw.write('event: draft-updated\ndata: {}\n\n');
                } else if (ev.type === 'usage') {
                    reply.raw.write(`event: usage\ndata: ${JSON.stringify(ev.value)}\n\n`);
                } else if (ev.type === 'activity') {
                    reply.raw.write(`event: activity\ndata: ${JSON.stringify(ev.value)}\n\n`);
                } else {
                    reply.raw.write(`data: ${JSON.stringify(ev.value)}\n\n`);
                }
            }
            reply.raw.write('data: [DONE]\n\n');
        } catch (err) {
            // Falla del LLM a mitad de turno: se avisa en el chat y se cierra
            // el stream con [DONE] para que el cliente libere su lock normal.
            this.logger.error(`forge stream failed for routine ${id}`, err instanceof Error ? err.stack : String(err));
            reply.raw.write(`data: ${JSON.stringify('\n\n⚠️ Forge tuvo un problema. Intenta de nuevo.')}\n\n`);
            reply.raw.write('data: [DONE]\n\n');
        } finally {
            reply.raw.end();
        }
    }
}
