import { IsUUID } from 'class-validator';

/**
 * `memberId` is required: the history of ONE member is the only listing the
 * product needs, and a global dump of every membership has no caller.
 */
export class ListMembershipsQueryDto {
    /** `app.members.id` (the member PROFILE id), not `app.users.id`. */
    @IsUUID()
    memberId!: string;
}
