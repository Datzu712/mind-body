import { pgSchema, serial, text, timestamp } from 'drizzle-orm/pg-core';

export const mySchema = pgSchema('core');

export const Users = mySchema.table('users', {
    id: serial('id').primaryKey(),
    keycloakId: text('keycloak_id').notNull().unique(),
    firstName: text('first_name'),
    lastName: text('last_name'),
    email: text('email'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export type User = typeof Users.$inferSelect;
