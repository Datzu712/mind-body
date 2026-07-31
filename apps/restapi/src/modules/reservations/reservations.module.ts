import { Module } from '@nestjs/common';
import { ClockModule } from '@/common/clock/clock.module';
import { ReservationsController } from './reservations.controller';
import { SessionReservationsController } from './session-reservations.controller';
import { ReservationsService } from './reservations.service';

/** Reservas: booking, cancelación (regla 12 h), reprogramación, asistencia y roster. */
@Module({
    imports: [ClockModule],
    controllers: [ReservationsController, SessionReservationsController],
    providers: [ReservationsService],
    exports: [ReservationsService],
})
export class ReservationsModule {}
