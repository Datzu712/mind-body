import { Module } from '@nestjs/common';
import { ClockModule } from '@/common/clock/clock.module';
import { ClassesController } from './classes.controller';
import { ClassesService } from './classes.service';
import { SessionMaterializerService } from './session-materializer.service';

/** Series de clases recurrentes + materializador de sesiones (cron). */
@Module({
    imports: [ClockModule],
    controllers: [ClassesController],
    providers: [ClassesService, SessionMaterializerService],
})
export class ClassesModule {}
