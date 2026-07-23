import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class UpdateMeasurementDto {
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
