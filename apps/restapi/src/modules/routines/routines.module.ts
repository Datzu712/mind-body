import { Module } from '@nestjs/common';
import { RoutinesController } from './routines.controller';
import { MemberRoutinesController } from './member-routines.controller';
import { ExercisesController } from './exercises.controller';
import { RoutinesService } from './routines.service';

@Module({
    controllers: [RoutinesController, MemberRoutinesController, ExercisesController],
    providers: [RoutinesService],
    exports: [RoutinesService],
})
export class RoutinesModule {}
