import { Module } from '@nestjs/common';
import { ClockModule } from '@/common/clock/clock.module';
import { ClassSessionsController } from './class-sessions.controller';
import { ClassSessionsService } from './class-sessions.service';

/** Sesiones materializadas del calendario: listado, detalle, move y cancelación. */
@Module({
    imports: [ClockModule],
    controllers: [ClassSessionsController],
    providers: [ClassSessionsService],
    exports: [ClassSessionsService],
})
export class ClassSessionsModule {}
