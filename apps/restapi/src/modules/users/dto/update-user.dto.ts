import { IsEnum, IsOptional, IsString } from 'class-validator';

export class UpdateUserDto {
    @IsOptional()
    @IsString()
    fullName?: string | undefined;

    @IsOptional()
    @IsString()
    phone?: string | undefined;

    @IsOptional()
    @IsEnum(['ACTIVE', 'INACTIVE', 'ARCHIVED'])
    status?: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED' | undefined;
}
