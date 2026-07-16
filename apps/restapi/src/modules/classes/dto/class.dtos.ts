import {
    ArrayNotEmpty,
    ArrayUnique,
    IsArray,
    IsBoolean,
    IsIn,
    IsInt,
    IsNotEmpty,
    IsOptional,
    IsString,
    IsUUID,
    Matches,
    Max,
    MaxLength,
    Min,
} from 'class-validator';
import type { ClassLevel, ClassSeriesStatus } from '../class.types';

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Campos editables de una serie (create/update comparten esta base). */
export class ClassSeriesWriteDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(120)
    name!: string;

    @IsString()
    @MaxLength(4000)
    description: string = '';

    @IsUUID()
    trainerId!: string;

    @IsArray()
    @ArrayNotEmpty()
    @ArrayUnique()
    @IsInt({ each: true })
    @Min(1, { each: true })
    @Max(7, { each: true })
    weekdays!: number[];

    @Matches(TIME_RE, { message: 'localStartTime must be HH:mm' })
    localStartTime!: string;

    @IsInt()
    @Min(1)
    @Max(1440)
    durationMinutes!: number;

    @IsInt()
    @Min(1)
    @Max(500)
    capacity!: number;

    @IsBoolean()
    allowWaitlist!: boolean;

    @Matches(DATE_RE, { message: 'startsOn must be YYYY-MM-DD' })
    startsOn!: string;

    @IsOptional()
    @IsString()
    @MaxLength(80)
    category?: string;

    @IsOptional()
    @IsIn(['LOW', 'MEDIUM', 'HIGH'])
    level?: ClassLevel;

    @IsOptional()
    @IsString()
    @MaxLength(120)
    room?: string;

    @IsOptional()
    @IsString()
    @MaxLength(120)
    zone?: string;
}

export class CreateClassDto extends ClassSeriesWriteDto {
    @IsIn(['ACTIVE', 'INACTIVE'])
    status!: Extract<ClassSeriesStatus, 'ACTIVE' | 'INACTIVE'>;
}

/** Update NO acepta status; la transición va por PUT /classes/:id/status. */
export class UpdateClassDto extends ClassSeriesWriteDto {}

export class SetClassStatusDto {
    @IsIn(['ACTIVE', 'INACTIVE'])
    status!: Extract<ClassSeriesStatus, 'ACTIVE' | 'INACTIVE'>;
}

export class ListClassesQueryDto {
    /** Por defecto se ocultan ARCHIVED. */
    @IsOptional()
    @IsIn(['ACTIVE', 'INACTIVE', 'ARCHIVED'])
    status?: ClassSeriesStatus;

    @IsOptional()
    @IsUUID()
    trainerId?: string;

    @IsOptional()
    @IsString()
    @MaxLength(120)
    q?: string;
}
