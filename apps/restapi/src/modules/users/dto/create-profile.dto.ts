import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';

export class CreateProfileDto {
    @IsEnum(['MEMBER', 'TRAINER', 'STAFF'])
    profileType!: 'MEMBER' | 'TRAINER' | 'STAFF';

    // Member fields
    @IsOptional()
    @IsDateString()
    joinedAt?: string | undefined;

    @IsOptional()
    @IsString()
    emergencyContactName?: string | undefined;

    @IsOptional()
    @IsString()
    emergencyContactPhone?: string | undefined;

    // Trainer fields
    @IsOptional()
    @IsString()
    specialty?: string | undefined;

    @IsOptional()
    @IsString()
    biography?: string | undefined;

    // Staff fields
    @IsOptional()
    @IsDateString()
    hiredAt?: string | undefined;
}
