import { Global, Module } from '@nestjs/common';
import { redisProvider } from './redis/redis-provider';
import { DrizzleService } from './pg/drizzle.service';

@Global()
@Module({
    providers: [redisProvider, DrizzleService],
    exports: [redisProvider, DrizzleService],
})
export class DatabaseModule {}
