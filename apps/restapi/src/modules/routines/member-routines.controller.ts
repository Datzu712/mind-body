import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';

import { CurrentUser } from '@/common/decorators/current-user.decorator';
import type { User } from '@/infra/database/pg/schemas/schema';
import { RoutinesService } from './routines.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { UpsertExerciseLogDto } from './dto/upsert-exercise-log.dto';

@Controller({ version: '1', path: '' })
export class MemberRoutinesController {
    constructor(private readonly routinesService: RoutinesService) {}

    @Post('sessions')
    async createSession(@CurrentUser() user: User, @Body() dto: CreateSessionDto) {
        return this.routinesService.createSession(user.id, dto);
    }

    @Post('sessions/:id/exercise-logs')
    async upsertLog(@CurrentUser() user: User, @Param('id') id: string, @Body() dto: UpsertExerciseLogDto) {
        return this.routinesService.upsertExerciseLog(user.id, id, dto);
    }

    @Post('sessions/:id/confirm')
    async confirm(@CurrentUser() user: User, @Param('id') id: string) {
        return this.routinesService.confirmSession(user.id, id);
    }

    @Post('sessions/:id/validate')
    async validate(@CurrentUser() user: User, @Param('id') id: string) {
        return this.routinesService.validateSession(user.id, id);
    }

    @Get('sessions')
    async findSessions(@CurrentUser() user: User, @Query('scope') scope?: string) {
        return this.routinesService.findSessions(user.id, scope);
    }

    @Get('sessions/:id')
    async findSession(@CurrentUser() user: User, @Param('id') id: string, @Query('scope') scope?: string) {
        return this.routinesService.findSessionDetail(user.id, id, scope);
    }

    @Get('notifications')
    async findNotifications(@CurrentUser() user: User) {
        return this.routinesService.findNotifications(user.id);
    }

    @Post('notifications/:id/read')
    async markRead(@CurrentUser() user: User, @Param('id') id: string) {
        return this.routinesService.markNotificationRead(user.id, id);
    }
}
