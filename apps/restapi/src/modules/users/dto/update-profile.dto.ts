import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateProfileDto {
    @IsString()
    @IsNotEmpty()
    firstName!: string;

    @IsString()
    @IsNotEmpty()
    lastName!: string;
}
