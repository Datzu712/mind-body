import { IsDateString, IsOptional } from 'class-validator';

export class UpdateStaffProfileDto {
    @IsOptional()
    @IsDateString()
    hiredAt?: string | undefined;
}
