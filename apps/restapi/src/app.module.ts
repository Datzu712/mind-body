import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';

import { AppConfigModule } from './config/config.module';
import { PinoLoggerModule } from './common/logger/logger.module';
import { V1Module } from './modules/v1.module';
import { DatabaseModule } from './infra/database/database.module';

@Module({
    imports: [AppConfigModule, PinoLoggerModule, DatabaseModule, ScheduleModule.forRoot(), V1Module],
})
export class AppModule {}
