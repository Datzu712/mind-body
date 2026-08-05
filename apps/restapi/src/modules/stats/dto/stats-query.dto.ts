import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class ReservationsTrendQueryDto {
    /** Number of weekly buckets to return, ending with the current week. */
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(52)
    weeks: number = 8;
}

export class PopularClassesQueryDto {
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(20)
    limit: number = 5;

    /** Look-back window in days. */
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(365)
    days: number = 30;
}

export class RecentReservationsQueryDto {
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(50)
    limit: number = 8;
}
