import type { User } from '../src/infra/database/pg/schemas/drizzle.schema';
import type { AppRole } from '../src/common/constant/roles.constant';

declare module 'fastify' {
    interface FastifyRequest {
        user?: User;
        roles?: AppRole[];
    }
}
