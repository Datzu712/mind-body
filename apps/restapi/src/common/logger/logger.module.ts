import { Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';

import { AppConfigModule } from '@/config/config.module';
import { TypedConfigService } from '@/config/typed-config.service';
import { NodeEnv } from '@/config/env';

// add pino-roll in the future
@Module({
    imports: [
        LoggerModule.forRootAsync({
            imports: [AppConfigModule],
            inject: [TypedConfigService],
            useFactory: (config: TypedConfigService) => ({
                pinoHttp: {
                    redact: {
                        paths: [
                            'req.headers.authorization',
                            'req.headers.cookie',
                            'req.body.password',
                            'req.body.*.password',
                            '*.token',
                        ],
                        censor: '[REDACTED]',
                    },
                    name: 'kivu-gateway',
                    level: config.getOrThrow('NODE_ENV') !== NodeEnv.Production ? 'debug' : 'info',
                    transport: {
                        targets:
                            config.getOrThrow('NODE_ENV') !== NodeEnv.Production
                                ? [
                                      {
                                          target: 'pino-pretty',
                                          level: 'debug',
                                          options: { colorize: true, ignore: 'pid,hostname' },
                                      },
                                      {
                                          target: 'pino/file',
                                          level: 'debug',
                                          options: {
                                              destination: 'logs/app.log',
                                              mkdir: true,
                                              sync: false,
                                          },
                                      },
                                  ]
                                : [
                                      {
                                          target: 'pino/file',
                                          level: 'info',
                                          options: { destination: 1 }, // stdout
                                      },
                                      {
                                          target: 'pino/file',
                                          level: 'info',
                                          options: {
                                              destination: 'logs/app.log',
                                              mkdir: true,
                                              sync: false,
                                          },
                                      },
                                  ],
                    },
                },
            }),
        }),
    ],
})
export class RestLoggerModule {}
