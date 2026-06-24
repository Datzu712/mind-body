import { Module } from '@nestjs/common';
import { TseService } from './tse.service';
import { TseController } from './tse.controller';
import { PadronModule } from '../padron/padron.module';

@Module({
    imports: [PadronModule],
    controllers: [TseController],
    providers: [TseService],
    exports: [TseService],
})
export class TseModule {}
