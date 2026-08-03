import {
    Body,
    Controller,
    Delete,
    Get,
    Headers,
    HttpCode,
    Param,
    ParseUUIDPipe,
    Post,
    Put,
    Query,
} from '@nestjs/common';
import type { User } from '@/infra/database/pg/schemas/schema';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { CurrentActor } from '@/common/decorators/current-actor.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { DASHBOARD_ROLES, MANAGEMENT_ROLES } from '@/common/constant/roles.constant';
import type { Actor } from '@/common/auth/actor';
import { ClassesService } from './classes.service';
import { CreateClassDto, ListClassesQueryDto, SetClassStatusDto, UpdateClassDto } from './dto/class.dtos';

// Dominio exclusivo del dashboard. Gestión → ADMIN/STAFF (default de clase, así
// un endpoint nuevo sin decorador queda cerrado); lectura → + TRAINER, recortada
// a sus propias series en el service. `@CurrentActor` autoriza, `@CurrentUser` audita.
@Roles(...MANAGEMENT_ROLES)
@Controller('classes')
export class ClassesController {
    constructor(private readonly classes: ClassesService) {}

    @Roles(...DASHBOARD_ROLES)
    @Get()
    async list(@Query() query: ListClassesQueryDto, @CurrentActor() actor: Actor) {
        return this.classes.list(query, actor);
    }

    /** Catálogo de entrenadores para asignar una serie: solo gestión. */
    @Get('trainer-options')
    async trainerOptions() {
        return this.classes.trainerOptions();
    }

    @Roles(...DASHBOARD_ROLES)
    @Get(':id')
    async detail(@Param('id', ParseUUIDPipe) id: string, @CurrentActor() actor: Actor) {
        return this.classes.detail(id, actor);
    }

    @Post()
    async create(@Body() dto: CreateClassDto, @CurrentUser() user: User) {
        return this.classes.create(dto, user.id);
    }

    @Put(':id')
    async update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: UpdateClassDto,
        @CurrentUser() user: User,
        @Headers('if-match') ifMatch?: string,
    ) {
        return this.classes.update(id, dto, user.id, ifMatch);
    }

    @Put(':id/status')
    async setStatus(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: SetClassStatusDto,
        @CurrentUser() user: User,
        @Headers('if-match') ifMatch?: string,
    ) {
        return this.classes.setStatus(id, dto, user.id, ifMatch);
    }

    /** Archivo lógico terminal; nunca borra filas. */
    @Delete(':id')
    @HttpCode(200)
    async archive(
        @Param('id', ParseUUIDPipe) id: string,
        @CurrentUser() user: User,
        @Headers('if-match') ifMatch?: string,
    ) {
        return this.classes.archive(id, user.id, ifMatch);
    }
}
