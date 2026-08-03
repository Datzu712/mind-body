import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { ExercisesService } from './exercises.service';
import { ListExercisesQueryDto } from './dto/exercise.dtos';

@Controller('exercises')
export class ExercisesController {
    constructor(private readonly exercises: ExercisesService) {}

    @Get()
    async list(@Query() query: ListExercisesQueryDto) {
        return this.exercises.list(query);
    }

    @Get('facets')
    async facets() {
        return this.exercises.facets();
    }

    @Get(':id')
    async detail(@Param('id', ParseUUIDPipe) id: string) {
        return this.exercises.detail(id);
    }
}
