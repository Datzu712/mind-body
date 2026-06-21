import { IsDateString, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateMeasurementDto {
    @IsOptional()
    @IsDateString()
    measuredAt?: string;

    @IsOptional()
    @IsNumber()
    @Min(0)
    weightKg?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    heightCm?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    bodyFatPercentage?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    waistCm?: number;

    @IsOptional()
    @IsString()
    notes?: string;
}
