import { Inject, Injectable } from '@nestjs/common';
import type Redis from 'ioredis';

import { DrizzleService } from '@/infra/database/pg/drizzle.service';
import { TypedConfigService } from '@/config/typed-config.service';
import { KeycloakAdminService } from '@/infra/keycloak/keycloak-admin.service';
import { REDIS_KEY } from '@/infra/database/redis/redis-provider';
import type { HealthReport, HealthServicesReport, HealthStatus, LivenessReport, ServiceHealth } from './health.types';

// todo: there is not a RFC standard for health checks but theres a draft about it that we could take as reference
// https://datatracker.ietf.org/doc/html/draft-inadarei-api-health-check-06#name-version
@Injectable()
export class HealthService {
    private readonly GENERAL_HEALTH_TTL_MS: number;

    constructor(
        private readonly drizzle: DrizzleService,
        @Inject(REDIS_KEY) private readonly redis: Redis,
        private readonly configService: TypedConfigService,
        private readonly keycloakAdmin: KeycloakAdminService,
    ) {
        this.GENERAL_HEALTH_TTL_MS = configService.get('GENERAL_HEALTH_TTL_MS', 5_000);
    }

    getLivenessReport(): LivenessReport {
        return {
            status: 'healthy',
            uptime: process.uptime(),
            timestamp: new Date().toISOString(),
        };
    }

    async checkDatabaseConnection(): Promise<ServiceHealth> {
        return this.runHealthCheck(async () => {
            await Promise.race([
                this.drizzle.db.execute('SELECT 1+1;'),
                new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Database query timeout')), this.GENERAL_HEALTH_TTL_MS),
                ),
            ]);
        });
    }

    async checkCacheConnection(): Promise<ServiceHealth> {
        return this.runHealthCheck(async () => {
            const r = await Promise.race([
                this.redis.ping(),
                new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Redis ping timeout')), this.GENERAL_HEALTH_TTL_MS),
                ),
            ]);

            if (r !== 'PONG') {
                throw new Error(`Read-write verification failed. Received: ${String(r)}`);
            }
        });
    }

    // todo: integrate with runHealthCheck
    async checkKeycloakConnection(): Promise<ServiceHealth> {
        const start = performance.now();

        try {
            const url = this.configService.getOrThrow('KC_HEALTH_URL');
            const response = await fetch(url, { signal: AbortSignal.timeout(this.GENERAL_HEALTH_TTL_MS) });

            if (!response.ok) {
                return {
                    status: 'unhealthy',
                    latencyMs: this.getLatencyMs(start),
                    error: `HTTP ${response.status}`,
                };
            }

            // Degraded: server up but admin client lost its token
            if (!this.keycloakAdmin.isAuthenticated) {
                return {
                    status: 'degraded',
                    latencyMs: this.getLatencyMs(start),
                    error: 'Admin client is not authenticated',
                };
            }

            return { status: 'healthy', latencyMs: this.getLatencyMs(start) };
        } catch (error) {
            return {
                status: 'unhealthy',
                latencyMs: this.getLatencyMs(start),
                error: this.getErrorMessage(error),
            };
        }
    }

    async getReadinessReport(): Promise<HealthReport> {
        const [database, cache, keycloak] = await Promise.all([
            this.checkDatabaseConnection(),
            this.checkCacheConnection(),
            this.checkKeycloakConnection(),
        ]);

        const services = { database, cache, keycloak };

        return {
            status: this.resolveOverallStatus(services),
            uptime: process.uptime(),
            timestamp: new Date().toISOString(),
            services,
        };
    }

    private resolveOverallStatus(services: HealthServicesReport): HealthStatus {
        const statuses = (Object.values(services) as ServiceHealth[]).map((service) => service.status);

        if (statuses.some((status) => status === 'unhealthy')) {
            return 'unhealthy';
        }

        if (statuses.some((status) => status === 'degraded')) {
            return 'degraded';
        }

        return 'healthy';
    }

    /**
     * This is just a function wrapper to calculate the time taken by the passed fn and if it throws an error, we catch it and return it in a structured way.
     */
    private async runHealthCheck(check: () => Promise<void>): Promise<ServiceHealth> {
        const start = performance.now();

        try {
            await check();

            return { status: 'healthy', latencyMs: this.getLatencyMs(start) };
        } catch (error) {
            return {
                status: 'unhealthy',
                latencyMs: this.getLatencyMs(start),
                error: this.getErrorMessage(error),
            };
        }
    }

    private getLatencyMs(start: number): number {
        return Math.round(performance.now() - start);
    }

    private getErrorMessage(error: unknown): string {
        return error instanceof Error ? error.message : 'Unknown error';
    }
}
