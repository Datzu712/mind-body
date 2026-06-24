import { IsDateString, IsEnum, IsOptional, IsString, Matches, MaxLength, ValidateIf } from 'class-validator';

export class UpdateUserDto {
    @IsOptional()
    @IsString()
    fullName?: string | undefined;

    @IsOptional()
    @IsString()
    phone?: string | undefined;

    @IsOptional()
    @IsString()
    @MaxLength(20)
    dni?: string | undefined;

    @IsOptional()
    @IsEnum(['CEDULA_NACIONAL', 'DIMEX', 'PASAPORTE'])
    dniType?: 'CEDULA_NACIONAL' | 'DIMEX' | 'PASAPORTE' | undefined;

    // Allow an empty string to clear the date; otherwise it must be a valid,
    // date-only ISO string (the `date` column has no time component).
    @IsOptional()
    @ValidateIf((o: UpdateUserDto) => o.birthDate !== '')
    @IsDateString()
    @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'birthDate must be a YYYY-MM-DD date' })
    birthDate?: string | undefined;

    @IsOptional()
    @IsEnum(['ACTIVE', 'INACTIVE', 'ARCHIVED'])
    status?: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED' | undefined;
}
