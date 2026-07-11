import { Controller, Get } from '@nestjs/common';

import { CurrentUser } from '@/common/decorators/current-user.decorator';
import type { User } from '@/infra/database/pg/schemas/schema';
import { RoutinesService } from './routines.service';

@Controller({ version: '1', path: 'exercises' })
export class ExercisesController {
    constructor(private readonly routinesService: RoutinesService) {}

    @Get()
    async findAll(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        @CurrentUser() _user: User,
    ) {
        return this.routinesService.findExercises();
    }
}
