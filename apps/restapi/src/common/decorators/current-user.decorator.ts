import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { FastifyRequest } from 'fastify';

export const CurrentUser = createParamDecorator(
    (_data: unknown, ctx: ExecutionContext) => ctx.switchToHttp().getRequest<FastifyRequest>().user,
);
