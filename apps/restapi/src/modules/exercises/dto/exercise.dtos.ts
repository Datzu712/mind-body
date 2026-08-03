import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class ListExercisesQueryDto {
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    limit: number = 24;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(0)
    offset: number = 0;

    /** Búsqueda por nombre (ILIKE %q%). */
    @IsOptional()
    @IsString()
    @MaxLength(120)
    q?: string;

    @IsOptional()
    @IsString()
    @MaxLength(80)
    bodyPart?: string;

    @IsOptional()
    @IsString()
    @MaxLength(80)
    equipment?: string;

    @IsOptional()
    @IsString()
    @MaxLength(80)
    target?: string;
}
