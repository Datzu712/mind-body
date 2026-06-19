import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
    schema: './src/infra/database/pg/schemas/**/*.ts',
    out: './drizzle',
    dialect: 'postgresql',
    dbCredentials: {
        url: process.env['DATABASE_URL']!,
    },
    schemaFilter: ['app'],
    casing: 'snake_case',
});
