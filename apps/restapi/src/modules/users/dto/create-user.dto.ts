import { IsDateString, IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class CreateMemberFields {
    @IsOptional()
    @IsDateString()
    joinedAt?: string | undefined;

    @IsOptional()
    @IsString()
    emergencyContactName?: string | undefined;

    @IsOptional()
    @IsString()
    emergencyContactPhone?: string | undefined;
}

class CreateTrainerFields {
    @IsOptional()
    @IsString()
    specialty?: string | undefined;

    @IsOptional()
    @IsString()
    biography?: string | undefined;
}

class CreateStaffFields {
    @IsOptional()
    @IsDateString()
    hiredAt?: string | undefined;
}

export class CreateUserDto {
    @IsString()
    @IsNotEmpty()
    fullName!: string;

    @IsEmail()
    email!: string;

    @IsOptional()
    @IsString()
    phone?: string | undefined;

    @IsEnum(['CEDULA_NACIONAL', 'DIMEX', 'PASAPORTE'])
    dniType!: 'CEDULA_NACIONAL' | 'DIMEX' | 'PASAPORTE';

    @IsString()
    @IsNotEmpty()
    dni!: string;

    @IsOptional()
    @IsDateString()
    birthDate?: string | undefined;

    @IsEnum(['MEMBER', 'TRAINER', 'STAFF'])
    profileType!: 'MEMBER' | 'TRAINER' | 'STAFF';

    @IsOptional()
    @ValidateNested()
    @Type(() => CreateMemberFields)
    memberFields?: CreateMemberFields | undefined;

    @IsOptional()
    @ValidateNested()
    @Type(() => CreateTrainerFields)
    trainerFields?: CreateTrainerFields | undefined;

    @IsOptional()
    @ValidateNested()
    @Type(() => CreateStaffFields)
    staffFields?: CreateStaffFields | undefined;
}
