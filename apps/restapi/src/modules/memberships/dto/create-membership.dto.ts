import { IsDateString, IsOptional, IsUUID, Matches } from 'class-validator';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Creating and renewing are the same operation: a renewal is just a new row
 * whose creation expires the member's previous ACTIVE one.
 *
 * There is no amount, no payment method and no invoice — money changes hands at
 * the front desk and the system never sees it. A membership is a dated flag.
 */
export class CreateMembershipDto {
    /** `app.members.id` (the member PROFILE id), not `app.users.id`. */
    @IsUUID()
    memberId!: string;

    /** Date-only on purpose: `Matches` rejects the datetime forms `IsDateString` would let through. */
    @IsDateString()
    @Matches(DATE_RE, { message: 'startDate must be a YYYY-MM-DD date' })
    startDate!: string;

    /** Must not precede `startDate` (also guarded by the `chk_membership_dates` CHECK). */
    @IsDateString()
    @Matches(DATE_RE, { message: 'endDate must be a YYYY-MM-DD date' })
    endDate!: string;

    /** Optional: without it the service falls back to the default plan. */
    @IsOptional()
    @IsUUID()
    planId?: string;
}
