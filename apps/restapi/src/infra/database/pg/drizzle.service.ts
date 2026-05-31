import { Injectable, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import { drizzle, PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import * as schema from './schemas/drizzle.schema';

@Injectable()
export class DrizzleService implements OnModuleDestroy, OnModuleInit {
    private readonly client: postgres.Sql;
    readonly db: PostgresJsDatabase<typeof schema>;

    constructor() {
        this.client = postgres(process.env['DATABASE_URL'] ?? '');
        this.db = drizzle(this.client, { schema, casing: 'snake_case' });
    }

    async onModuleInit() {
        try {
            await this.db.execute('SELECT 1+1 AS result');
        } catch (cause) {
            throw new Error(`Failed to connect to the database`, { cause });
        }
    }

    async onModuleDestroy() {
        await this.client.end();
    }
}
