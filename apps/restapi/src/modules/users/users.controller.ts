import { Body, Controller, ForbiddenException, Get, Param, Post, Put, Query, Req } from '@nestjs/common';
import type { FastifyRequest } from 'fastify';

import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { DASHBOARD_ROLES, canAssignProfileType } from '@/common/constant/roles.constant';
import type { User } from '@/infra/database/pg/schemas/schema';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ListUsersQueryDto } from './dto/list-users-query.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateMemberProfileDto } from './dto/update-member-profile.dto';
import { UpdateTrainerProfileDto } from './dto/update-trainer-profile.dto';
import { UpdateStaffProfileDto } from './dto/update-staff-profile.dto';
import { UsersService } from './users.service';

// Admin-dashboard user directory. /me is the exception — any authenticated user (mobile included).
@Roles(...DASHBOARD_ROLES)
@Controller({ version: '1', path: 'users' })
export class UsersController {
    constructor(private readonly usersService: UsersService) {}

    private assertCanAssignProfileType(request: FastifyRequest, profileType: 'MEMBER' | 'TRAINER' | 'STAFF'): void {
        if (!canAssignProfileType(request.roles ?? [], profileType)) {
            throw new ForbiddenException('Trainers cannot add members.');
        }
    }

    @Roles()
    @Get('me')
    getMe(@CurrentUser() user: User): User {
        return user;
    }

    @Roles()
    @Put('me')
    async updateMe(@CurrentUser() user: User, @Body() dto: UpdateProfileDto): Promise<User> {
        return this.usersService.updateProfile(user.keycloakSubject, dto);
    }

    @Get()
    async findAll(@Query() query: ListUsersQueryDto) {
        return this.usersService.findAll(query);
    }

    @Get(':id')
    async findById(@Param('id') id: string) {
        return this.usersService.findById(id);
    }

    @Post()
    async create(@Body() dto: CreateUserDto, @Req() request: FastifyRequest) {
        this.assertCanAssignProfileType(request, dto.profileType);
        return this.usersService.create(dto);
    }

    @Put('/:id')
    async update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
        return this.usersService.update(id, dto);
    }

    @Post('/:id/profiles')
    async createProfile(@Param('id') id: string, @Body() dto: CreateProfileDto, @Req() request: FastifyRequest) {
        this.assertCanAssignProfileType(request, dto.profileType);
        return this.usersService.createProfile(id, dto);
    }

    @Put('/:id/profiles/member')
    async updateMemberProfile(@Param('id') id: string, @Body() dto: UpdateMemberProfileDto) {
        return this.usersService.updateMemberProfile(id, dto);
    }

    @Put('/:id/profiles/trainer')
    async updateTrainerProfile(@Param('id') id: string, @Body() dto: UpdateTrainerProfileDto) {
        return this.usersService.updateTrainerProfile(id, dto);
    }

    @Put('/:id/profiles/staff')
    async updateStaffProfile(@Param('id') id: string, @Body() dto: UpdateStaffProfileDto) {
        return this.usersService.updateStaffProfile(id, dto);
    }
}
