import { Injectable } from '@nestjs/common';
import { DateTime } from 'luxon';
import { TypedConfigService } from '@/config/typed-config.service';

/**
 * Reloj inyectable del dominio. TODA comparación temporal del módulo pasa por
 * acá (testeable) y usa BUSINESS_TIME_ZONE como zona local del negocio; la BD
 * guarda instantes timestamptz.
 */
@Injectable()
export class ClockService {
    readonly timeZone: string;

    constructor(configService: TypedConfigService) {
        this.timeZone = configService.getOrThrow('BUSINESS_TIME_ZONE');
    }

    /** Instante actual. */
    now(): DateTime {
        return DateTime.now();
    }

    /** Instante actual proyectado a la zona del negocio. */
    nowLocal(): DateTime {
        return this.now().setZone(this.timeZone);
    }

    /** 'YYYY-MM-DD' + 'HH:mm[:ss]' locales del negocio → instante. */
    fromLocal(date: string, time: string): DateTime {
        return DateTime.fromISO(`${date}T${time}`, { zone: this.timeZone });
    }

    /** Instante (ISO/SQL de la BD) → DateTime en la zona del negocio. */
    toLocal(instant: string): DateTime {
        return DateTime.fromSQL(instant, { setZone: true }).isValid
            ? DateTime.fromSQL(instant).setZone(this.timeZone)
            : DateTime.fromISO(instant).setZone(this.timeZone);
    }
}
