import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import type { FastifyReply } from 'fastify';

import { HealthService } from './health.service';
import { Public } from '../auth/decorators/public-endpoint.decorator';
import type { HealthReport } from './health.types';

@Controller({
    version: '1',
    path: 'health',
})
export class HealthController {
    constructor(private readonly healthService: HealthService) {}

    @Public()
    @Get('/')
    async checkHealth(@Res({ passthrough: true }) reply: FastifyReply) {
        const report = await this.healthService.getReadinessReport();

        reply.status(this.getHttpStatus(report));

        return report;
    }

    /**
     * Simplemente representa si el proceso esta vivo y no bloqueado.
     *
     * Este no quiere decir si la db, kc, cache, etc... son funcionales
     */
    @Public()
    @Get('/live')
    checkLiveness() {
        return this.healthService.getLivenessReport();
    }

    /**
     * Representa si el proceso esta vivo y ademas si las dependencias criticas (db, kc, cache) son funcionales.
     */
    @Public()
    @Get('/ready')
    async checkReadiness(@Res({ passthrough: true }) reply: FastifyReply) {
        const report = await this.healthService.getReadinessReport();

        reply.status(this.getHttpStatus(report));

        return report;
    }

    private getHttpStatus(report: HealthReport): number {
        if (report.status === 'healthy') {
            return HttpStatus.OK;
        }

        if (report.status === 'degraded') {
            return HttpStatus.MULTI_STATUS;
        }

        return HttpStatus.SERVICE_UNAVAILABLE;
    }
}
