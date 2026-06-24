import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export class ListUsersQueryDto {
    @IsOptional()
    @Transform(({ value }) => Number(value))
    @IsInt()
    @Min(1)
    page: number = 1;

    @IsOptional()
    @Transform(({ value }) => Number(value))
    @IsInt()
    @Min(1)
    @Max(100)
    limit: number = 20;

    @IsOptional()
    @IsString()
    name?: string | undefined;

    @IsOptional()
    @IsString()
    email?: string | undefined;

    @IsOptional()
    @IsString()
    phone?: string | undefined;

    @IsOptional()
    @IsEnum(['MEMBER', 'TRAINER', 'STAFF'])
    profile?: 'MEMBER' | 'TRAINER' | 'STAFF' | undefined;

    @IsOptional()
    @IsEnum(['ACTIVE', 'INACTIVE', 'ARCHIVED'])
    status?: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED' | undefined;

    @IsOptional()
    @IsEnum(['fullName', 'phone', 'status', 'createdAt'])
    sortBy?: 'fullName' | 'phone' | 'status' | 'createdAt' | undefined;

    @IsOptional()
    @IsEnum(['asc', 'desc'])
    sortDir?: 'asc' | 'desc' | undefined;
}
