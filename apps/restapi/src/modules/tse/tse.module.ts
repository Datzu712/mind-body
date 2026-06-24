import { Module } from '@nestjs/common';
import { TseService } from './tse.service';
import { TseController } from './tse.controller';

@Module({
    controllers: [TseController],
    providers: [TseService],
    exports: [TseService],
})
export class TseModule {}
