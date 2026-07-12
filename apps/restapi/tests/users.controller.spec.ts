import { describe, expect, it, vi } from 'vitest';
import { ForbiddenException } from '@nestjs/common';
import type { FastifyRequest } from 'fastify';

import { UsersController } from '../src/modules/users/users.controller';
import type { UsersService } from '../src/modules/users/users.service';
import type { CreateUserDto } from '../src/modules/users/dto/create-user.dto';
import type { CreateProfileDto } from '../src/modules/users/dto/create-profile.dto';
import type { AppRole } from '../src/common/constant/roles.constant';

function makeService() {
    return {
        create: vi.fn(async (dto: CreateUserDto) => ({ id: 'new-user', ...dto })),
        createProfile: vi.fn(async (id: string, dto: CreateProfileDto) => ({ id, ...dto })),
    } as unknown as UsersService;
}

function makeRequest(roles: AppRole[] | undefined): FastifyRequest {
    return { roles } as unknown as FastifyRequest;
}

const baseCreateUserDto: CreateUserDto = {
    fullName: 'Juan Perez',
    email: 'juan@example.com',
    dniType: 'CEDULA_NACIONAL',
    dni: '1-2345-6789',
    profileType: 'MEMBER',
};

const baseCreateProfileDto: CreateProfileDto = {
    profileType: 'MEMBER',
};

describe('UsersController.create — trainers cannot add members', () => {
    it('rejects a TRAINER-only session creating a MEMBER, without touching the service', async () => {
        const service = makeService();
        const controller = new UsersController(service);

        await expect(
            controller.create({ ...baseCreateUserDto, profileType: 'MEMBER' }, makeRequest(['TRAINER'])),
        ).rejects.toThrow(ForbiddenException);
        expect(service.create).not.toHaveBeenCalled();
    });

    it('rejects when roles are missing entirely (defensive default)', async () => {
        const service = makeService();
        const controller = new UsersController(service);

        await expect(
            controller.create({ ...baseCreateUserDto, profileType: 'MEMBER' }, makeRequest(undefined)),
        ).rejects.toThrow(ForbiddenException);
        expect(service.create).not.toHaveBeenCalled();
    });

    it.each<AppRole>(['ADMIN', 'STAFF'])('allows %s to create a MEMBER', async (role) => {
        const service = makeService();
        const controller = new UsersController(service);
        const dto: CreateUserDto = { ...baseCreateUserDto, profileType: 'MEMBER' };

        await controller.create(dto, makeRequest([role]));
        expect(service.create).toHaveBeenCalledWith(dto);
    });

    it.each<'TRAINER' | 'STAFF'>(['TRAINER', 'STAFF'])(
        'allows a TRAINER-only session to create a %s (only MEMBER is restricted)',
        async (profileType) => {
            const service = makeService();
            const controller = new UsersController(service);
            const dto: CreateUserDto = { ...baseCreateUserDto, profileType };

            await controller.create(dto, makeRequest(['TRAINER']));
            expect(service.create).toHaveBeenCalledWith(dto);
        },
    );
});

describe('UsersController.createProfile — same restriction when attaching a profile to an existing user', () => {
    it('rejects a TRAINER-only session attaching a MEMBER profile', async () => {
        const service = makeService();
        const controller = new UsersController(service);

        await expect(
            controller.createProfile(
                'user-1',
                { ...baseCreateProfileDto, profileType: 'MEMBER' },
                makeRequest(['TRAINER']),
            ),
        ).rejects.toThrow(ForbiddenException);
        expect(service.createProfile).not.toHaveBeenCalled();
    });

    it.each<AppRole>(['ADMIN', 'STAFF'])('allows %s to attach a MEMBER profile', async (role) => {
        const service = makeService();
        const controller = new UsersController(service);
        const dto: CreateProfileDto = { ...baseCreateProfileDto, profileType: 'MEMBER' };

        await controller.createProfile('user-1', dto, makeRequest([role]));
        expect(service.createProfile).toHaveBeenCalledWith('user-1', dto);
    });

    it('allows a TRAINER-only session to attach a TRAINER profile', async () => {
        const service = makeService();
        const controller = new UsersController(service);
        const dto: CreateProfileDto = { ...baseCreateProfileDto, profileType: 'TRAINER' };

        await controller.createProfile('user-1', dto, makeRequest(['TRAINER']));
        expect(service.createProfile).toHaveBeenCalledWith('user-1', dto);
    });
});
