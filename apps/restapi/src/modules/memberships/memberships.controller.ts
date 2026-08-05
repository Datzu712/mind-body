import { Body, Controller, Get, HttpCode, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';

import { Roles } from '@/common/decorators/roles.decorator';
import { DASHBOARD_ROLES, MANAGEMENT_ROLES } from '@/common/constant/roles.constant';
import { CreateMembershipDto } from './dto/create-membership.dto';
import { ListMembershipsQueryDto } from './dto/list-memberships-query.dto';
import { MembershipsService } from './memberships.service';

/**
 * Membership administration. Same split as `users`: the whole dashboard can
 * read (a trainer opens a member's profile) and only ADMIN/STAFF can write —
 * they are the ones at the front desk. MEMBER never gets in: memberships are
 * handled at the gym, not from mobile.
 *
 * Management roles are the class default so a new endpoint added without a
 * decorator stays closed.
 */
@Roles(...MANAGEMENT_ROLES)
@Controller({ version: '1', path: 'memberships' })
export class MembershipsController {
    constructor(private readonly memberships: MembershipsService) {}

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
     * Only accepted on an already lapsed term (`MEMBERSHIP_NOT_EXPIRED` otherwise).
     */
    @Patch(':id/cancel')
    @HttpCode(200)
    async cancel(@Param('id', ParseUUIDPipe) id: string) {
        return this.memberships.cancel(id);
    }
}
