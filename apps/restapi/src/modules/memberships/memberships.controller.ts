import { Body, Controller, Get, HttpCode, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';

import { Roles } from '@/common/decorators/roles.decorator';
import { APP_ROLES, DASHBOARD_ROLES, MANAGEMENT_ROLES } from '@/common/constant/roles.constant';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import type { User } from '@/infra/database/pg/schemas/schema';
import { CancelMembershipDto } from './dto/cancel-membership.dto';
import { CreateMembershipDto } from './dto/create-membership.dto';
import { ListMembershipsQueryDto } from './dto/list-memberships-query.dto';
import { MembershipsService } from './memberships.service';

/**
 * Membership administration. Same split as `users`: the whole dashboard can
 * read (a trainer opens a member's profile) and only ADMIN/STAFF can write —
 * they are the ones at the front desk. A MEMBER only ever reaches `mine`:
 * memberships are sold at the gym, never from mobile.
 *
 * Management roles are the class default so a new endpoint added without a
 * decorator stays closed.
 */
@Roles(...MANAGEMENT_ROLES)
@Controller({ version: '1', path: 'memberships' })
export class MembershipsController {
    constructor(private readonly memberships: MembershipsService) {}

    /**
     * The member's own history, newest first. Self-scoped by `@CurrentUser`, so
     * it takes no id and cannot be pointed at somebody else — same shape as
     * `GET /routines/mine`.
     */
    @Roles(...APP_ROLES)
    @Get('mine')
    async mine(@CurrentUser() user: User) {
        return this.memberships.findMine(user.id);
    }

    @Roles(...DASHBOARD_ROLES)
    @Get()
    async findByMember(@Query() query: ListMembershipsQueryDto) {
        return this.memberships.findByMember(query);
    }

    /** Create and renew are one endpoint: a renewal expires the previous ACTIVE term. */
    @Post()
    async create(@Body() dto: CreateMembershipDto) {
        return this.memberships.create(dto);
    }

    /**
     * PATCH rather than DELETE: the membership is not removed, it changes state.
     * A lapsed term cancels with no body; a running one needs
     * `reason: 'ADMIN_OVERRIDE'` (409 `MEMBERSHIP_NOT_EXPIRED` without it).
     */
    @Patch(':id/cancel')
    @HttpCode(200)
    async cancel(@Param('id', ParseUUIDPipe) id: string, @Body() dto: CancelMembershipDto) {
        return this.memberships.cancel(id, dto.reason === 'ADMIN_OVERRIDE');
    }
}
