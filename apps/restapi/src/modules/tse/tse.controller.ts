import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { TseService } from './tse.service';
import { Public } from '../auth/decorators/public-endpoint.decorator';

@Controller({ version: '1', path: 'tse' })
export class TseController {
    constructor(private readonly tseService: TseService) {}

    @Public()
    @Get(':cedula')
    async lookup(@Param('cedula') cedula: string) {
        const result = await this.tseService.lookup(cedula);
        if (!result) {
            throw new NotFoundException(`No se encontro la cedula ${cedula} en el TSE`);
        }
        return result;
    }
}
