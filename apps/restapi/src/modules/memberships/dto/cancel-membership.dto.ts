import { IsIn, IsOptional } from 'class-validator';

/**
 * Cancelling a term that is still running is management's call, but it has to be
 * asked for: `ADMIN_OVERRIDE` is never inferred from the caller's role, so a
 * mistyped id cannot silently revoke a paid-up membership. Mirrors
 * `AdminCancelReservationDto`.
 *
 * Optional at the pipe level because the ordinary case (a lapsed term) sends no
 * body at all, and ValidationPipe validates `{}` then.
 */
export class CancelMembershipDto {
    @IsOptional()
    @IsIn(['TERM_LAPSED', 'ADMIN_OVERRIDE'])
    reason?: 'TERM_LAPSED' | 'ADMIN_OVERRIDE';
}
