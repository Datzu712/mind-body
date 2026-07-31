import { Body, Controller, Get, Post, Res } from '@nestjs/common';
import type { FastifyReply } from 'fastify';

import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { type User } from '@/infra/database/pg/schemas/schema';
import { AgentService } from './agent.service';
import { ChatDto } from './dto/chat.dto';
import { Public } from '../auth/decorators/public-endpoint.decorator';

async function* fakeStream(): AsyncGenerator<string> {
    const words = [
        'Esto',
        ' es',
        ' un',
        ' stream',
        ' de prueba.',
        ' Cada',
        ' yield',
        ' es',
        ' un',
        ' token',
        ' de',
        ' prueba.',
    ];
    for (const word of words) {
        await new Promise((resolve) => setTimeout(resolve, 150));
        yield word;
    }
}

@Controller({ version: '1', path: 'ai' })
export class AgentController {
    constructor(private readonly agentService: AgentService) {}

    @Post('chat')
    async chat(@Body() dto: ChatDto, @CurrentUser() user: User, @Res() reply: FastifyReply): Promise<void> {
        reply.hijack();
        reply.raw.writeHead(200, {
            'Content-Type': 'text/event-stream; charset=utf-8',
            'Cache-Control': 'no-cache',
            Connection: 'keep-alive',
        });

        try {
            for await (const token of this.agentService.streamChat(dto.message, user)) {
                reply.raw.write(`data: ${JSON.stringify(token)}\n\n`);
            }
            reply.raw.write('data: [DONE]\n\n');
        } finally {
            reply.raw.end();
        }
    }

    @Public()
    @Get('test-stream')
    async testStream(@Res() reply: FastifyReply): Promise<void> {
        reply.hijack();

        reply.raw.writeHead(200, {
            'Content-Type': 'text/event-stream; charset=utf-8',
            'Cache-Control': 'no-cache',
            Connection: 'keep-alive',
        });

        try {
            // fakeStream() es un AsyncGenerator igual que agentService.streamChat()
            // el controller no sabe ni le importa de dónde vienen los tokens
            for await (const token of fakeStream()) {
                reply.raw.write(`data: ${JSON.stringify(token)}\n\n`);
            }
            reply.raw.write('data: [DONE]\n\n');
        } finally {
            reply.raw.end();
        }
    }
}
