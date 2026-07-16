import { Module } from '@nestjs/common';
import { ClockService } from './clock.service';

/** Reloj del negocio (BUSINESS_TIME_ZONE) compartido por clases/sesiones/reservas. */
@Module({
    providers: [ClockService],
    exports: [ClockService],
})
export class ClockModule {}
