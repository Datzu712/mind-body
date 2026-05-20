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
    HOST: string = 'localhost';

    @IsEnum(NodeEnv)
    NODE_ENV: NodeEnv = NodeEnv.Development;

    @IsString()
    CORS_ORIGIN: string = 'localhost:3000';

    @IsString()
    DATABASE_URL!: string;
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
