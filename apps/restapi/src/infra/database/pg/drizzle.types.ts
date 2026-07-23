import type { DrizzleService } from './drizzle.service';

export type Db = DrizzleService['db'];
/** Transacción drizzle (también válida para savepoints anidados). */
export type DbTx = Parameters<Parameters<Db['transaction']>[0]>[0];
