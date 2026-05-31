import type { User } from '../src/infra/database/pg/schemas/drizzle.schema';

declare module 'fastify' {
    interface FastifyRequest {
        user?: User;
    }
}
