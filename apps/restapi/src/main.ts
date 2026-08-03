import 'reflect-metadata';
import 'dotenv/config';

import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import fastifyCookie from '@fastify/cookie';
import { Logger } from 'nestjs-pino';

import { AppModule } from './app.module';
import { TypedConfigService } from './config/typed-config.service';
import { ValidationPipe } from '@nestjs/common';
import { VersioningType } from '@nestjs/common/enums/version-type.enum';
//import { DelayedResponseInterceptor } from './utils/delayed-response.interceptor';

async function bootstrap(): Promise<void> {
    const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter({ logger: false }), {
        bufferLogs: true,
    });

    await app.register(fastifyCookie);

    const logger = app.get(Logger);
    app.useLogger(logger);

    const config = app.get(TypedConfigService);

    app.enableCors({
        origin: config.getOrThrow('CORS_ORIGIN'),
        credentials: true,
    });

    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));

    app.enableShutdownHooks();

    app.setGlobalPrefix('api');
    app.enableVersioning({
        type: VersioningType.URI,
        defaultVersion: '1',
    });

    await app.listen(config.get('PORT'), config.getOrThrow('HOST'));
    logger.log(`Server running on http://${config.getOrThrow('HOST')}:${config.getOrThrow('PORT')}`);
    logger.log(`Forge coach: ${config.get('FORGE_MODEL')} (${config.get('FORGE_REASONING_EFFORT')})`);
    logger.log(
        `Forge routines: ${config.get('FORGE_ROUTINES_MODEL')} (${config.get('FORGE_ROUTINES_REASONING_EFFORT')})`,
    );
}

void bootstrap();
