import { IsOptional, IsString } from 'class-validator';

export class UpdateTrainerProfileDto {
    @IsOptional()
    @IsString()
    specialty?: string | undefined;

    @IsOptional()
    @IsString()
    biography?: string | undefined;
}
