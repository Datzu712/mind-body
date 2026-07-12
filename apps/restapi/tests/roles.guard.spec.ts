import { describe, expect, it } from 'vitest';
import { ForbiddenException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { FastifyRequest } from 'fastify';

import { RolesGuard } from '../src/modules/auth/guards/roles.guard';
import { UsersController } from '../src/modules/users/users.controller';
import { MemberMeasurementsController } from '../src/modules/measurements/member-measurements.controller';
import { MemberActivityController } from '../src/modules/activity/member-activity.controller';
import { AuthController } from '../src/modules/auth/auth.controller';
import type { AppRole } from '../src/common/constant/roles.constant';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Handler = (...args: any[]) => unknown;

// Real Reflector reading real @Roles()/@Public() metadata off the actual controller
// classes — this is a regression guard: if `@Roles(...)` is ever removed from one of
// these production handlers, the corresponding case below fails immediately.
function makeContext(handler: Handler, cls: Function, roles: AppRole[] | undefined): ExecutionContext {
    const request = { roles } as unknown as FastifyRequest;
    return {
        getHandler: () => handler,
        getClass: () => cls,
        switchToHttp: () => ({
            getRequest: () => request,
            getResponse: () => ({}),
            getNext: () => ({}),
        }),
    } as unknown as ExecutionContext;
}

const guard = new RolesGuard(new Reflector());

interface Case {
    label: string;
    handler: Handler;
    cls: Function;
    roles: AppRole[] | undefined;
    allowed: boolean;
}

const cases: Case[] = [
    // UsersController — class-level @Roles(...DASHBOARD_ROLES)
    {
        label: 'MEMBER blocked from GET /users',
        handler: UsersController.prototype.findAll,
        cls: UsersController,
        roles: ['MEMBER'],
        allowed: false,
    },
    {
        label: 'MEMBER blocked from GET /users/:id',
        handler: UsersController.prototype.findById,
        cls: UsersController,
        roles: ['MEMBER'],
        allowed: false,
    },
    {
        label: 'MEMBER blocked from POST /users',
        handler: UsersController.prototype.create,
        cls: UsersController,
        roles: ['MEMBER'],
        allowed: false,
    },
    {
        label: 'no roles at all blocked from GET /users',
        handler: UsersController.prototype.findAll,
        cls: UsersController,
        roles: [],
        allowed: false,
    },
    {
        label: 'undefined roles blocked from GET /users',
        handler: UsersController.prototype.findAll,
        cls: UsersController,
        roles: undefined,
        allowed: false,
    },
    {
        label: 'TRAINER allowed on GET /users',
        handler: UsersController.prototype.findAll,
        cls: UsersController,
        roles: ['TRAINER'],
        allowed: true,
    },
    {
        label: 'STAFF allowed on GET /users',
        handler: UsersController.prototype.findAll,
        cls: UsersController,
        roles: ['STAFF'],
        allowed: true,
    },
    {
        label: 'ADMIN allowed on GET /users',
        handler: UsersController.prototype.findAll,
        cls: UsersController,
        roles: ['ADMIN'],
        allowed: true,
    },

    // UsersController — method-level @Roles() override on /me routes: any authenticated role
    {
        label: 'MEMBER allowed on GET /users/me (self-service override)',
        handler: UsersController.prototype.getMe,
        cls: UsersController,
        roles: ['MEMBER'],
        allowed: true,
    },
    {
        label: 'MEMBER allowed on PUT /users/me (self-service override)',
        handler: UsersController.prototype.updateMe,
        cls: UsersController,
        roles: ['MEMBER'],
        allowed: true,
    },
    {
        label: 'no roles at all still allowed on GET /users/me',
        handler: UsersController.prototype.getMe,
        cls: UsersController,
        roles: [],
        allowed: true,
    },

    // MemberMeasurementsController — class-level @Roles(...DASHBOARD_ROLES)
    {
        label: 'MEMBER blocked from GET /users/:id/measurements',
        handler: MemberMeasurementsController.prototype.findAll,
        cls: MemberMeasurementsController,
        roles: ['MEMBER'],
        allowed: false,
    },
    {
        label: 'MEMBER blocked from GET /users/:id/measurements/summary',
        handler: MemberMeasurementsController.prototype.getSummary,
        cls: MemberMeasurementsController,
        roles: ['MEMBER'],
        allowed: false,
    },
    {
        label: 'TRAINER allowed on GET /users/:id/measurements/summary',
        handler: MemberMeasurementsController.prototype.getSummary,
        cls: MemberMeasurementsController,
        roles: ['TRAINER'],
        allowed: true,
    },

    // MemberActivityController — class-level @Roles(...DASHBOARD_ROLES)
    {
        label: 'MEMBER blocked from GET /users/:id/activity/daily/range',
        handler: MemberActivityController.prototype.getDailyRange,
        cls: MemberActivityController,
        roles: ['MEMBER'],
        allowed: false,
    },
    {
        label: 'ADMIN allowed on GET /users/:id/activity/daily/range',
        handler: MemberActivityController.prototype.getDailyRange,
        cls: MemberActivityController,
        roles: ['ADMIN'],
        allowed: true,
    },

    // AuthController — no @Roles metadata at all on /auth/me: falls back to "just authenticated"
    {
        label: 'MEMBER allowed on GET /auth/me (no @Roles metadata)',
        handler: AuthController.prototype.me,
        cls: AuthController,
        roles: ['MEMBER'],
        allowed: true,
    },

    // AuthController — @Public() short-circuits before roles are even inspected
    {
        label: '@Public() login route allowed with undefined roles',
        handler: AuthController.prototype.login,
        cls: AuthController,
        roles: undefined,
        allowed: true,
    },
    {
        label: '@Public() callback route allowed with no roles',
        handler: AuthController.prototype.callback,
        cls: AuthController,
        roles: [],
        allowed: true,
    },
];

describe('RolesGuard — production route matrix (regression guard against permission leaks)', () => {
    it.each(cases)('$label', ({ handler, cls, roles, allowed }) => {
        const ctx = makeContext(handler, cls, roles);
        if (allowed) {
            expect(guard.canActivate(ctx)).toBe(true);
        } else {
            expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
        }
    });
});
