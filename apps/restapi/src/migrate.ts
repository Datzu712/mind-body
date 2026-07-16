/**
 * Runner one-shot de migraciones para despliegue (Task 10 del plan).
 *
 * Se ejecuta como job/init-container ANTES de levantar la API:
 *
 *   node dist/src/migrate.js
 *
 * La API nunca ejecuta DDL implícito al arrancar; cada réplica asume que este
 * job ya corrió con éxito. Usa el migrador programático de drizzle-orm (dep de
 * producción) sobre la carpeta ./drizzle copiada a la imagen.
 */
import 'dotenv/config';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';

async function main(): Promise<void> {
    const url = process.env['DATABASE_URL'];
    if (!url) throw new Error('DATABASE_URL is required');

    const client = postgres(url, { max: 1 });
    try {
        await migrate(drizzle(client), { migrationsFolder: './drizzle' });
        console.log('[migrate] migrations applied successfully');
    } finally {
        await client.end();
    }
}

main().catch((error: unknown) => {
    console.error('[migrate] migration failed', error);
    process.exit(1);
});
