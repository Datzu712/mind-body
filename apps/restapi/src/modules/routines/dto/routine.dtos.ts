import { Type } from 'class-transformer';
import {
    ArrayNotEmpty,
    IsArray,
    IsIn,
    IsInt,
    IsOptional,
    IsString,
    IsUUID,
    Max,
    MaxLength,
    Min,
} from 'class-validator';

/** Estados manejables desde la API (PAUSED/FINISHED existen en el enum pero no en este slice). */
export const EDITABLE_ROUTINE_STATUSES = ['DRAFT', 'ACTIVE', 'ARCHIVED'] as const;
export type EditableRoutineStatus = (typeof EDITABLE_ROUTINE_STATUSES)[number];

export class CreateRoutineDto {
    @IsOptional()
    @IsString()
    @MaxLength(120)
    name?: string;

    @IsOptional()
    @IsString()
    @MaxLength(2000)
    objective?: string;
}

export class UpdateRoutineDto {
    @IsOptional()
    @IsString()
    @MaxLength(120)
    name?: string;

    /** null limpia el objetivo; undefined lo deja igual. */
    @IsOptional()
    @IsString()
    @MaxLength(2000)
    objective?: string | null;

    @IsOptional()
    @IsIn(EDITABLE_ROUTINE_STATUSES)
    status?: EditableRoutineStatus;
}

export class ListRoutinesQueryDto {
    /** Búsqueda por nombre (ILIKE %q%). */
    @IsOptional()
    @IsString()
    @MaxLength(120)
    q?: string;

    @IsOptional()
    @IsIn(EDITABLE_ROUTINE_STATUSES)
    status?: EditableRoutineStatus;
}

export class AddRoutineExerciseDto {
    @IsUUID()
    exerciseId!: string;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(20)
    sets?: number;

    @IsOptional()
    @IsString()
    @MaxLength(40)
    reps?: string;

    @IsOptional()
    @IsString()
    @MaxLength(500)
    notes?: string;
}

export class UpdateRoutineExerciseDto {
    /** null limpia el campo; undefined lo deja igual (aplica a los tres). */
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(20)
    sets?: number | null;

    @IsOptional()
    @IsString()
    @MaxLength(40)
    reps?: string | null;

    @IsOptional()
    @IsString()
    @MaxLength(500)
    notes?: string | null;
}

export class ReorderRoutineExercisesDto {
    /** Lista COMPLETA de itemIds en el nuevo orden. */
    @IsArray()
    @ArrayNotEmpty()
    @IsUUID('all', { each: true })
    itemIds!: string[];
}

export class AssignRoutineDto {
    @IsUUID()
    memberId!: string;
}
