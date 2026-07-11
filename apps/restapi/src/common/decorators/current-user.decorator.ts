import { User } from '@/infra/database/pg/schemas/schema';
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { FastifyRequest } from 'fastify';

export const CurrentUser = createParamDecorator<unknown, User | undefined>(
    (_data: unknown, ctx: ExecutionContext) => ctx.switchToHttp().getRequest<FastifyRequest>().user as User | undefined,
);
