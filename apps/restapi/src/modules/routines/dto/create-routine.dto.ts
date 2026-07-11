import { ArrayMinSize, IsArray, IsOptional, IsString, MaxLength, ValidateNested } from 'class-validator';
import { Transform, Type } from 'class-transformer';

import { RoutineExerciseDto } from './routine-exercise.dto';

function normalizeExercise(item: unknown): RoutineExerciseDto {
    const raw = item as Record<string, unknown>;
    const dto = new RoutineExerciseDto();
    dto.exerciseId = (raw.exercise_id ?? raw.exerciseId) as string;
    dto.displayOrder = Number(raw.display_order ?? raw.displayOrder) || 1;
    if (typeof raw.sets === 'number') dto.sets = raw.sets;
    if (typeof raw.reps === 'string') dto.reps = raw.reps;
    if (typeof raw.notes === 'string') dto.notes = raw.notes;
    return dto;
}

export class CreateRoutineDto {
    @IsString()
    @MaxLength(120)
    name!: string;

    @IsOptional()
    @IsString()
    objective?: string;

    @IsArray()
    @ArrayMinSize(1)
    @ValidateNested({ each: true })
    @Type(() => RoutineExerciseDto)
    @Transform(({ value }: { value: unknown }) => (Array.isArray(value) ? value.map(normalizeExercise) : value))
    exercises!: RoutineExerciseDto[];
}
