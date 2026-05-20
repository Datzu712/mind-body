import { Module } from '@nestjs/common';

// import { DrizzleModule } from './common/database/pg/drizzle.module';
import { AppConfigModule } from './config/config.module';
import { RestLoggerModule } from './common/logger/logger.module';

@Module({
    imports: [AppConfigModule, RestLoggerModule],
})
export class AppModule {}
