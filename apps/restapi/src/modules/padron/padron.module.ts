import { Module } from '@nestjs/common';
import { PadronService } from './padron.service';

@Module({
    providers: [PadronService],
    exports: [PadronService],
})
export class PadronModule {}
