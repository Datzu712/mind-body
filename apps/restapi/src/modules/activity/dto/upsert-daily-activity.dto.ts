import { IsDateString, IsEnum, IsInt, IsNumber, IsOptional, Min } from 'class-validator';

export class UpsertDailyActivityDto {
    @IsDateString()
    date!: string;

    @IsOptional()
    @IsInt()
    @Min(0)
    steps?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    caloriesTotal?: number;

    @IsOptional()
    @IsInt()
    @Min(0)
    activeMinutes?: number;

    @IsOptional()
    @IsInt()
    @Min(0)
    exerciseCount?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    distanceMeters?: number;

    @IsEnum(['HEALTH_CONNECT', 'MANUAL'])
    source!: 'HEALTH_CONNECT' | 'MANUAL';
}
