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
import { ClassesService } from './classes.service';
import { CreateClassDto, ListClassesQueryDto, SetClassStatusDto, UpdateClassDto } from './dto/class.dtos';

// TODO(RBAC): cuando el RolesGuard del equipo esté disponible, restringir:
// gestión → ADMIN/STAFF; lectura → ADMIN/STAFF/TRAINER (trainer solo sus series).
@Controller('classes')
export class ClassesController {
    constructor(private readonly classes: ClassesService) {}

    @Get()
    async list(@Query() query: ListClassesQueryDto) {
        return this.classes.list(query);
    }

    @Get('trainer-options')
    async trainerOptions() {
        return this.classes.trainerOptions();
    }

    @Get(':id')
    async detail(@Param('id', ParseUUIDPipe) id: string) {
        return this.classes.detail(id);
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
