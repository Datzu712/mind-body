import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { validateEnv } from './env';
import { TypedConfigService } from './typed-config.service';

@Global()
@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            validate: validateEnv,
        }),
    ],
    providers: [TypedConfigService],
    exports: [TypedConfigService],
})
export class AppConfigModule {}
