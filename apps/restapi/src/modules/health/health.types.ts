export type HealthStatus = 'healthy' | 'unhealthy' | 'degraded';

export interface ServiceHealth {
    status: HealthStatus;
    latencyMs: number;
    error?: string;
}

export interface HealthServicesReport {
    database: ServiceHealth;
    cache: ServiceHealth;
    keycloak: ServiceHealth;
}

export interface HealthReport {
    status: HealthStatus;
    uptime: number;
    timestamp: string;
    services: HealthServicesReport;
}

export interface LivenessReport {
    status: 'healthy';
    uptime: number;
    timestamp: string;
}
