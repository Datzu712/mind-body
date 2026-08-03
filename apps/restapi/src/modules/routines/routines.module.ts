import { Module } from '@nestjs/common';
import { ExercisesModule } from '@/modules/exercises/exercises.module';
import { RoutinesController } from './routines.controller';
import { RoutinesService } from './routines.service';
import { RoutinesForgeController } from './routines-forge.controller';
import { RoutinesForgeService } from './routines-forge.service';

@Module({
    imports: [ExercisesModule],
    controllers: [RoutinesController, RoutinesForgeController],
    providers: [RoutinesService, RoutinesForgeService],
    exports: [RoutinesService],
})
export class RoutinesModule {}
