import { serial, text, pgSchema } from 'drizzle-orm/pg-core';

export const mySchema = pgSchema('core');

// todo: agregar el resto de tablas pendientes
export const Users = mySchema.table('users', {
    id: serial('id').primaryKey(),
    name: text('name'),
});
