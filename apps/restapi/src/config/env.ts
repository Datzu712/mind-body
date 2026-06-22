import { plainToInstance } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsNumber, IsString, Max, Min, validateSync } from 'class-validator';

export enum NodeEnv {
    Development = 'development',
    Production = 'production',
    Test = 'test',
}

class EnvironmentVariables {
    @IsNumber()
    @Min(1)
    @Max(65535)
    PORT: number = 3000;

    @IsString()
    @IsNotEmpty()
    REDIS_URL!: string;

    @IsString()
    @IsNotEmpty()
    HOST: string = 'localhost';

    @IsEnum(NodeEnv)
    NODE_ENV: NodeEnv = NodeEnv.Development;

    @IsString()
    CORS_ORIGIN: string = 'localhost:3000';

    @IsString()
    @IsNotEmpty()
    DATABASE_URL!: string;

    @IsString()
    KC_BASE_URL!: string;

    @IsString()
    KC_ADMIN_CLIENT_SECRET!: string;

    // This client is expected to be used by the admin dashboard with authorization code flow AND also
    // have "Service account roles" enabled so we can perform admin operations, its like killing two birds with one stone.
    // If the token in the request is obtained through cookies, then the AZP should be this client, otherwise the rest will throw an error.
    @IsString()
    KC_ADMIN_CLIENT_ID!: string;

    // This client is expected to be used by the mobile app with authorization code flow and make request using bearer tokens.
    // If the token in the request is obtained through headers, then the AZP should be this client, otherwise the rest will throw an error.
    @IsString()
    KC_MOBILE_CLIENT_ID!: string;

    @IsString()
    KC_REALM!: string;

    @IsString()
    KC_HEALTH_URL!: string;

    // Audience for mobile tokens (bearer/header strategy)
    @IsString()
    KC_REST_API_AUDIENCE!: string;

    // Audience for dashboard tokens (cookie strategy) — ensures only dashboard-issued tokens are accepted via cookies
    @IsString()
    KC_DASHBOARD_AUDIENCE!: string;

    // URL of the dashboard frontend (used for redirects after auth flow)
    @IsString()
    @IsNotEmpty()
    DASHBOARD_URL!: string;

    @IsNumber()
    @Min(1000)
    @Max(30000)
    GENERAL_HEALTH_TTL_MS: number = 5_000;
}

export type IEnvironmentVariables = EnvironmentVariables;

export function validateEnv(config: Record<string, unknown>): IEnvironmentVariables {
    const validated = plainToInstance(EnvironmentVariables, config, {
        enableImplicitConversion: true,
    });

    const errors = validateSync(validated, { skipMissingProperties: false });

    if (errors.length > 0) {
        throw new Error(`Environment validation failed:\n${errors.toString()}`);
    }

    return validated;
}
