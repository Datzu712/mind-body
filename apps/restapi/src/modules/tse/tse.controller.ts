import { Controller, Get, Logger, NotFoundException, Param } from '@nestjs/common';
import { TseService, type TsePersonData } from './tse.service';
import { PadronService } from '../padron/padron.service';
import { Public } from '../auth/decorators/public-endpoint.decorator';

@Controller({ version: '1', path: 'tse' })
export class TseController {
    private readonly logger = new Logger(TseController.name);

    constructor(
        private readonly tseService: TseService,
        private readonly padronService: PadronService,
    ) {}

    @Public()
    @Get(':cedula')
    async lookup(@Param('cedula') cedula: string) {
        // TseService contract: `null` = TSE was reachable but found nothing, `throw` = TSE unavailable.
        let tse: TsePersonData | null;
        try {
            tse = await this.tseService.lookup(cedula);
        } catch {
            // TSE is unavailable — fall back to the local padrón file.
            this.logger.warn(`TSE unavailable for cedula ${cedula}, falling back to padron`);
            const padron = await this.padronService.lookup(cedula);
            if (padron) {
                return padron;
            }
            throw new NotFoundException(`No se encontro la cedula ${cedula}`);
        }

        // TSE was reachable: trust it. A miss here is authoritative — do NOT consult the padrón.
        if (tse) {
            return { ...tse, source: 'TSE' as const };
        }
        throw new NotFoundException(`No se encontro la cedula ${cedula} en el TSE`);
    }
}
