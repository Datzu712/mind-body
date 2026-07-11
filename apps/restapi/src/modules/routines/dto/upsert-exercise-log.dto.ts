import { IsBoolean, IsInt, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class UpsertExerciseLogDto {
    @IsUUID()
    routineExerciseId!: string;

    @IsOptional()
    @IsNumber()
    @Min(0)
    weightKgActual?: number;

    @IsOptional()
    @IsString()
    completedRepsLog?: string;

    @IsOptional()
    @IsInt()
    @Min(0)
    completedSets?: number;

    @IsOptional()
    @IsString()
    notes?: string;

    @IsOptional()
    @IsBoolean()
    completed?: boolean;
}
