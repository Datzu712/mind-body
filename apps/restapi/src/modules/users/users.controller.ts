import { Body, Controller, Get, Param, Post, Put, Query } from '@nestjs/common';

import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { APP_ROLES, DASHBOARD_ROLES, MANAGEMENT_ROLES } from '@/common/constant/roles.constant';
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

// Directorio de usuarios del dashboard. /me es la excepción: la declara con
// APP_ROLES porque también la consume mobile (MEMBER).
@Roles(...DASHBOARD_ROLES)
@Controller({ version: '1', path: 'users' })
export class UsersController {
    constructor(private readonly usersService: UsersService) {}

    @Roles(...APP_ROLES)
    @Get('me')
    getMe(@CurrentUser() user: User): User {
        return user;
    }

    @Roles(...APP_ROLES)
    @Put('me')
    async updateMe(@CurrentUser() user: User, @Body() dto: UpdateProfileDto): Promise<User> {
        return this.usersService.updateProfile(user.keycloakSubject, dto);
    }

    @Roles(...DASHBOARD_ROLES)
    @Get()
    async findAll(@Query() query: ListUsersQueryDto) {
        return this.usersService.findAll(query);
    }

    @Roles(...DASHBOARD_ROLES)
    @Get(':id')
    async findById(@Param('id') id: string) {
        return this.usersService.findById(id);
    }

    @Roles(...MANAGEMENT_ROLES)
    @Post()
    async create(@Body() dto: CreateUserDto) {
        return this.usersService.create(dto);
    }

    @Roles(...MANAGEMENT_ROLES)
    @Put('/:id')
    async update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
        return this.usersService.update(id, dto);
    }

    @Roles(...MANAGEMENT_ROLES)
    @Post('/:id/profiles')
    async createProfile(@Param('id') id: string, @Body() dto: CreateProfileDto) {
        return this.usersService.createProfile(id, dto);
    }

    @Roles(...MANAGEMENT_ROLES)
    @Put('/:id/profiles/member')
    async updateMemberProfile(@Param('id') id: string, @Body() dto: UpdateMemberProfileDto) {
        return this.usersService.updateMemberProfile(id, dto);
    }

    @Roles(...MANAGEMENT_ROLES)
    @Put('/:id/profiles/trainer')
    async updateTrainerProfile(@Param('id') id: string, @Body() dto: UpdateTrainerProfileDto) {
        return this.usersService.updateTrainerProfile(id, dto);
    }

    @Roles(...MANAGEMENT_ROLES)
    @Put('/:id/profiles/staff')
    async updateStaffProfile(@Param('id') id: string, @Body() dto: UpdateStaffProfileDto) {
        return this.usersService.updateStaffProfile(id, dto);
    }
}
