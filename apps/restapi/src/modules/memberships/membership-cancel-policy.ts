import { DomainHttpException } from '@/common/domain/domain-http.exception';

/** Mirror of `app.membership_status`. */
export type MembershipStatus = 'ACTIVE' | 'SUSPENDED' | 'EXPIRED' | 'CANCELLED';

/** The two fields the cancel rule looks at — nothing else influences the verdict. */
export interface CancellableMembership {
    status: MembershipStatus;
    /** 'YYYY-MM-DD' (the `date` column comes out of drizzle as a plain string). */
    endDate: string;
}

/**
 * A membership is cancellable once it is no longer running: either the term is
 * over (`endDate` is strictly in the past) or somebody already marked it
 * EXPIRED.
 *
 * `today` is a 'YYYY-MM-DD' local business date, so plain string comparison is
 * exact — ISO dates sort lexicographically — and it sidesteps timezone drift
 * that `new Date()` would introduce.
 */
export function isCancellable(membership: CancellableMembership, today: string): boolean {
    return membership.status === 'EXPIRED' || membership.endDate < today;
}

/**
 * Cancelling means "the member left, stop sending renewal reminders". Doing it
 * to a running term revokes access already paid for at the front desk, so it is
 * refused by default — but management legitimately needs it when a member quits
 * mid-term, gets a refund, or the dates were entered wrong.
 *
 * So the escape hatch is `ADMIN_OVERRIDE`: allowed, but the intent is explicit
 * and never inferred from the caller's role, the same contract
 * `AdminCancelReservationDto` uses for late cancellations.
 *
 * Pure function on purpose (`today` is injected, no DB, no Nest) so the rule is
 * testable on its own — same shape as `measurement-edit-policy`.
 */
export function assertCancellable(membership: CancellableMembership, today: string, override = false): void {
    if (membership.status === 'CANCELLED') {
        throw new DomainHttpException(409, 'MEMBERSHIP_ALREADY_CANCELLED', 'La membresía ya está cancelada.', {
            status: membership.status,
        });
    }

    if (override) return;

    if (!isCancellable(membership, today)) {
        throw new DomainHttpException(
            409,
            'MEMBERSHIP_NOT_EXPIRED',
            'La membresía sigue vigente. Para cancelarla igualmente, confirmá la cancelación administrativa.',
            { status: membership.status, endDate: membership.endDate, today },
        );
    }
}
