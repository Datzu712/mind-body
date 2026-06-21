import { Type } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, ValidateNested } from 'class-validator';

import { UpsertDailyActivityDto } from './upsert-daily-activity.dto';

export class BatchDailyActivityDto {
    @ValidateNested({ each: true })
    @Type(() => UpsertDailyActivityDto)
    @ArrayMinSize(1)
    @ArrayMaxSize(365)
    items!: UpsertDailyActivityDto[];
}
