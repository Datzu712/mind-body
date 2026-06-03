import { Body, Controller, Get, Put } from '@nestjs/common';

import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { type User } from '@/infra/database/pg/schemas/drizzle.schema';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UsersService } from './users.service';

@Controller({ version: '1', path: 'users' })
export class UsersController {
    constructor(private readonly usersService: UsersService) {}

    @Get('me')
    getMe(@CurrentUser() user: User): User {
        return user;
    }

    @Put('me')
    async updateMe(@CurrentUser() user: User, @Body() dto: UpdateProfileDto): Promise<User> {
        return this.usersService.updateProfile(user.keycloakId, dto);
    }
}
