import { Module } from '@nestjs/common';
import { ClockModule } from '@/common/clock/clock.module';
import { ExercisesModule } from '@/modules/exercises/exercises.module';
import { RoutinesController } from './routines.controller';
import { RoutinesService } from './routines.service';
import { RoutinesForgeController } from './routines-forge.controller';
import { RoutinesForgeService } from './routines-forge.service';

@Module({
    imports: [ClockModule, ExercisesModule],
    controllers: [RoutinesController, RoutinesForgeController],
    providers: [RoutinesService, RoutinesForgeService],
    exports: [RoutinesService],
})
export class RoutinesModule {}
