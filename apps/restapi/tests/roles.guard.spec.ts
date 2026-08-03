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
import { ClassesController } from '../src/modules/classes/classes.controller';
import { ClassSessionsController } from '../src/modules/class-sessions/class-sessions.controller';
import { ReservationsController } from '../src/modules/reservations/reservations.controller';
import { SessionReservationsController } from '../src/modules/reservations/session-reservations.controller';
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

    // UsersController — method-level @Roles(...MANAGEMENT_ROLES) override: ADMIN/STAFF only,
    // TRAINER can view the directory (class-level DASHBOARD_ROLES above) but not manage it.
    {
        label: 'TRAINER blocked from POST /users (create)',
        handler: UsersController.prototype.create,
        cls: UsersController,
        roles: ['TRAINER'],
        allowed: false,
    },
    {
        label: 'ADMIN allowed on POST /users (create)',
        handler: UsersController.prototype.create,
        cls: UsersController,
        roles: ['ADMIN'],
        allowed: true,
    },
    {
        label: 'STAFF allowed on POST /users (create)',
        handler: UsersController.prototype.create,
        cls: UsersController,
        roles: ['STAFF'],
        allowed: true,
    },
    {
        label: 'TRAINER blocked from PUT /users/:id (update)',
        handler: UsersController.prototype.update,
        cls: UsersController,
        roles: ['TRAINER'],
        allowed: false,
    },
    {
        label: 'ADMIN allowed on PUT /users/:id (update)',
        handler: UsersController.prototype.update,
        cls: UsersController,
        roles: ['ADMIN'],
        allowed: true,
    },
    {
        label: 'TRAINER blocked from POST /users/:id/profiles (createProfile)',
        handler: UsersController.prototype.createProfile,
        cls: UsersController,
        roles: ['TRAINER'],
        allowed: false,
    },
    {
        label: 'STAFF allowed on POST /users/:id/profiles (createProfile)',
        handler: UsersController.prototype.createProfile,
        cls: UsersController,
        roles: ['STAFF'],
        allowed: true,
    },
    {
        label: 'TRAINER blocked from PUT /users/:id/profiles/member',
        handler: UsersController.prototype.updateMemberProfile,
        cls: UsersController,
        roles: ['TRAINER'],
        allowed: false,
    },
    {
        label: 'TRAINER blocked from PUT /users/:id/profiles/trainer',
        handler: UsersController.prototype.updateTrainerProfile,
        cls: UsersController,
        roles: ['TRAINER'],
        allowed: false,
    },
    {
        label: 'TRAINER blocked from PUT /users/:id/profiles/staff',
        handler: UsersController.prototype.updateStaffProfile,
        cls: UsersController,
        roles: ['TRAINER'],
        allowed: false,
    },
    {
        label: 'ADMIN allowed on PUT /users/:id/profiles/staff',
        handler: UsersController.prototype.updateStaffProfile,
        cls: UsersController,
        roles: ['ADMIN'],
        allowed: true,
    },

    // UsersController — method-level @Roles(...APP_ROLES) override on /me routes: mobile included
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
        label: 'TRAINER allowed on GET /users/me (any app role)',
        handler: UsersController.prototype.getMe,
        cls: UsersController,
        roles: ['TRAINER'],
        allowed: true,
    },

    // Política de rol vacío: un token sin ningún rol de la app no entra a nada
    // que no sea @Public(), ni siquiera a las rutas self-service.
    {
        label: 'no roles at all blocked from GET /users/me',
        handler: UsersController.prototype.getMe,
        cls: UsersController,
        roles: [],
        allowed: false,
    },
    {
        label: 'undefined roles blocked from PUT /users/me',
        handler: UsersController.prototype.updateMe,
        cls: UsersController,
        roles: undefined,
        allowed: false,
    },
    {
        label: 'no roles at all blocked from GET /auth/me (route without @Roles)',
        handler: AuthController.prototype.me,
        cls: AuthController,
        roles: [],
        allowed: false,
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

    // ClassesController — dominio de dashboard: gestión ADMIN/STAFF (default de
    // clase), lectura + TRAINER. MEMBER no entra en absoluto.
    {
        label: 'MEMBER blocked from GET /classes',
        handler: ClassesController.prototype.list,
        cls: ClassesController,
        roles: ['MEMBER'],
        allowed: false,
    },
    {
        label: 'TRAINER allowed on GET /classes (lectura recortada en el service)',
        handler: ClassesController.prototype.list,
        cls: ClassesController,
        roles: ['TRAINER'],
        allowed: true,
    },
    {
        label: 'TRAINER allowed on GET /classes/:id',
        handler: ClassesController.prototype.detail,
        cls: ClassesController,
        roles: ['TRAINER'],
        allowed: true,
    },
    {
        label: 'TRAINER blocked from POST /classes',
        handler: ClassesController.prototype.create,
        cls: ClassesController,
        roles: ['TRAINER'],
        allowed: false,
    },
    {
        label: 'TRAINER blocked from PUT /classes/:id',
        handler: ClassesController.prototype.update,
        cls: ClassesController,
        roles: ['TRAINER'],
        allowed: false,
    },
    {
        label: 'TRAINER blocked from PUT /classes/:id/status',
        handler: ClassesController.prototype.setStatus,
        cls: ClassesController,
        roles: ['TRAINER'],
        allowed: false,
    },
    {
        label: 'TRAINER blocked from DELETE /classes/:id (archivar)',
        handler: ClassesController.prototype.archive,
        cls: ClassesController,
        roles: ['TRAINER'],
        allowed: false,
    },
    {
        label: 'TRAINER blocked from GET /classes/trainer-options (helper de gestión)',
        handler: ClassesController.prototype.trainerOptions,
        cls: ClassesController,
        roles: ['TRAINER'],
        allowed: false,
    },
    {
        label: 'STAFF allowed on POST /classes',
        handler: ClassesController.prototype.create,
        cls: ClassesController,
        roles: ['STAFF'],
        allowed: true,
    },
    {
        label: 'ADMIN allowed on DELETE /classes/:id',
        handler: ClassesController.prototype.archive,
        cls: ClassesController,
        roles: ['ADMIN'],
        allowed: true,
    },

    // ClassSessionsController — lectura del calendario compartida con mobile;
    // mover/cancelar sesiones es gestión.
    {
        label: 'MEMBER allowed on GET /class-sessions (catálogo de mobile)',
        handler: ClassSessionsController.prototype.list,
        cls: ClassSessionsController,
        roles: ['MEMBER'],
        allowed: true,
    },
    {
        label: 'MEMBER allowed on GET /class-sessions/:id',
        handler: ClassSessionsController.prototype.detail,
        cls: ClassSessionsController,
        roles: ['MEMBER'],
        allowed: true,
    },
    {
        label: 'TRAINER allowed on GET /class-sessions (agenda propia)',
        handler: ClassSessionsController.prototype.list,
        cls: ClassSessionsController,
        roles: ['TRAINER'],
        allowed: true,
    },
    {
        label: 'MEMBER blocked from PUT /class-sessions/:id/schedule',
        handler: ClassSessionsController.prototype.move,
        cls: ClassSessionsController,
        roles: ['MEMBER'],
        allowed: false,
    },
    {
        label: 'TRAINER blocked from PUT /class-sessions/:id/schedule',
        handler: ClassSessionsController.prototype.move,
        cls: ClassSessionsController,
        roles: ['TRAINER'],
        allowed: false,
    },
    {
        label: 'TRAINER blocked from POST /class-sessions/:id/cancel',
        handler: ClassSessionsController.prototype.cancel,
        cls: ClassSessionsController,
        roles: ['TRAINER'],
        allowed: false,
    },
    {
        label: 'ADMIN allowed on PUT /class-sessions/:id/schedule',
        handler: ClassSessionsController.prototype.move,
        cls: ClassSessionsController,
        roles: ['ADMIN'],
        allowed: true,
    },
    {
        label: 'STAFF allowed on POST /class-sessions/:id/cancel',
        handler: ClassSessionsController.prototype.cancel,
        cls: ClassSessionsController,
        roles: ['STAFF'],
        allowed: true,
    },

    // ReservationsController — dueño (MEMBER) o gestión; asistencia solo gestión.
    {
        label: 'MEMBER allowed on GET /reservations/me',
        handler: ReservationsController.prototype.listMine,
        cls: ReservationsController,
        roles: ['MEMBER'],
        allowed: true,
    },
    {
        label: 'ADMIN blocked from GET /reservations/me (self-service de miembro)',
        handler: ReservationsController.prototype.listMine,
        cls: ReservationsController,
        roles: ['ADMIN'],
        allowed: false,
    },
    {
        label: 'MEMBER allowed on POST /reservations/:id/cancel (el service valida ownership)',
        handler: ReservationsController.prototype.cancel,
        cls: ReservationsController,
        roles: ['MEMBER'],
        allowed: true,
    },
    {
        label: 'STAFF allowed on POST /reservations/:id/cancel',
        handler: ReservationsController.prototype.cancel,
        cls: ReservationsController,
        roles: ['STAFF'],
        allowed: true,
    },
    {
        label: 'TRAINER blocked from POST /reservations/:id/cancel',
        handler: ReservationsController.prototype.cancel,
        cls: ReservationsController,
        roles: ['TRAINER'],
        allowed: false,
    },
    {
        label: 'TRAINER blocked from POST /reservations/:id/reschedule',
        handler: ReservationsController.prototype.reschedule,
        cls: ReservationsController,
        roles: ['TRAINER'],
        allowed: false,
    },
    {
        label: 'MEMBER allowed on GET /reservations/:id/reschedule-options',
        handler: ReservationsController.prototype.rescheduleOptions,
        cls: ReservationsController,
        roles: ['MEMBER'],
        allowed: true,
    },
    {
        label: 'MEMBER blocked from PUT /reservations/:id/attendance',
        handler: ReservationsController.prototype.markAttendance,
        cls: ReservationsController,
        roles: ['MEMBER'],
        allowed: false,
    },
    {
        label: 'TRAINER blocked from PUT /reservations/:id/attendance',
        handler: ReservationsController.prototype.markAttendance,
        cls: ReservationsController,
        roles: ['TRAINER'],
        allowed: false,
    },
    {
        label: 'ADMIN allowed on PUT /reservations/:id/attendance',
        handler: ReservationsController.prototype.markAttendance,
        cls: ReservationsController,
        roles: ['ADMIN'],
        allowed: true,
    },

    // SessionReservationsController — roster de gestión (+ TRAINER lectura),
    // booking exclusivo de MEMBER.
    {
        label: 'MEMBER blocked from GET /class-sessions/:id/reservations (roster)',
        handler: SessionReservationsController.prototype.roster,
        cls: SessionReservationsController,
        roles: ['MEMBER'],
        allowed: false,
    },
    {
        label: 'TRAINER allowed on GET /class-sessions/:id/reservations (solo su sesión, en el service)',
        handler: SessionReservationsController.prototype.roster,
        cls: SessionReservationsController,
        roles: ['TRAINER'],
        allowed: true,
    },
    {
        label: 'STAFF allowed on GET /class-sessions/:id/reservations',
        handler: SessionReservationsController.prototype.roster,
        cls: SessionReservationsController,
        roles: ['STAFF'],
        allowed: true,
    },
    {
        label: 'MEMBER allowed on POST /class-sessions/:id/reservations (booking)',
        handler: SessionReservationsController.prototype.book,
        cls: SessionReservationsController,
        roles: ['MEMBER'],
        allowed: true,
    },
    {
        label: 'ADMIN blocked from POST /class-sessions/:id/reservations (booking es self-scoped)',
        handler: SessionReservationsController.prototype.book,
        cls: SessionReservationsController,
        roles: ['ADMIN'],
        allowed: false,
    },
    {
        label: 'TRAINER blocked from POST /class-sessions/:id/reservations',
        handler: SessionReservationsController.prototype.book,
        cls: SessionReservationsController,
        roles: ['TRAINER'],
        allowed: false,
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
