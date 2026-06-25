import { IsOptional, IsString } from 'class-validator';

export class UpdateMemberProfileDto {
    @IsOptional()
    @IsString()
    emergencyContactName?: string | undefined;

    @IsOptional()
    @IsString()
    emergencyContactPhone?: string | undefined;

    @IsOptional()
    @IsString()
    notes?: string | undefined;
}
