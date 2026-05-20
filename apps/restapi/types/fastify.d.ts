import type { IntrospectionResponse } from 'openid-client';

declare module 'fastify' {
    interface FastifyRequest {
        user?: IntrospectionResponse;
    }
}
