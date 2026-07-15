import { Transform } from 'class-transformer';
import { IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

export class RoutineExerciseDto {
    @Transform(
        ({ obj }: { obj: Record<string, unknown> }) =>
            (obj.routine_exercise_id ?? obj.routineExerciseId ?? obj.id) as string,
    )
    @IsOptional()
    @IsUUID()
    routineExerciseId?: string;

    @Transform(({ obj }: { obj: Record<string, unknown> }) => (obj.exercise_id ?? obj.exerciseId) as string)
    @IsUUID()
    exerciseId!: string;

    @Transform(({ obj }: { obj: Record<string, unknown> }) => Number(obj.display_order ?? obj.displayOrder) || 1)
    @IsInt()
    @Min(1)
    displayOrder!: number;

    @IsOptional()
    @IsInt()
    @Min(1)
    sets?: number;

    @IsOptional()
    @IsString()
    reps?: string;

    @IsOptional()
    @IsString()
    notes?: string;

    @Transform(({ obj }: { obj: Record<string, unknown> }) => obj.rest_seconds ?? obj.restSeconds ?? 60)
    @IsInt()
    @Min(0)
    @Max(600)
    restSeconds!: number;
}
