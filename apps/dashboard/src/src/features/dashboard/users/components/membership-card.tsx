import { useState } from 'react';
import { formatDate } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { IdCard, Ban, RefreshCw } from 'lucide-react';
import { sileo } from 'sileo';
import type { Membership, MembershipStatus } from '../types';
import { useCancelMembership, useMemberships } from '../hooks';
import { RenewMembershipDialog } from './renew-membership-dialog';

const membershipStatusLabels: Record<MembershipStatus, string> = {
    ACTIVE: 'Activa',
    SUSPENDED: 'Suspendida',
    EXPIRED: 'Vencida',
    CANCELLED: 'Cancelada',
};

// CANCELLED is neutral, not destructive: destructive already marks EXPIRED, the
// state that still needs a follow-up. A cancelled membership needs nothing.
const membershipStatusColors: Record<MembershipStatus, string> = {
    ACTIVE: 'border-success/30 bg-success/20 text-success',
    SUSPENDED: 'border-warning/30 bg-warning/20 text-warning',
    EXPIRED: 'border-destructive/30 bg-destructive/20 text-destructive',
    CANCELLED: 'border-border bg-muted/50 text-muted-foreground',
};

interface MembershipCardProps {
    /** `members.id` (`user.memberProfile.id`), which is what the API keys memberships by. */
    memberId: string | undefined;
    /** Renewing and cancelling are ADMIN/STAFF in the API; a trainer only reads. */
    canManage: boolean;
}

/** Current membership term plus its history, with renew and cancel actions. */
export function MembershipCard({ memberId, canManage }: MembershipCardProps) {
    const [renewOpen, setRenewOpen] = useState(false);
    const { data, isLoading, isError, error } = useMemberships(memberId);
    const cancelMembership = useCancelMembership(memberId ?? '');

    // The API returns the history newest-first, so the head is the current term.
    const [current, ...history] = data ?? [];

    const handleCancel = (membership: Membership) => {
        sileo.action({
            title: '¿Cancelar la membresía?',
            description: 'Se deja de dar seguimiento al miembro y no se le enviarán recordatorios de renovación.',
            button: {
                title: 'Confirmar',
                onClick: () => {
                    void cancelMembership
                        .mutateAsync(membership.id)
                        .then(() => sileo.success({ title: 'Membresía cancelada' }))
                        .catch((e: unknown) =>
                            sileo.error({
                                title: 'No se pudo cancelar',
                                description: e instanceof Error ? e.message : undefined,
                            }),
                        );
                },
            },
        });
    };

    return (
        <>
            <Card className="border-border bg-card">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-foreground">
                        <IdCard className="h-5 w-5" />
                        Membresia
                    </CardTitle>
                    {canManage && (
                        <div className="flex items-center gap-2">
                            {/* Cancelling is only legal on a lapsed term; the server decides
                                (`cancellable`) and the button explains itself when it cannot. */}
                            {current &&
                                current.status !== 'CANCELLED' &&
                                (current.cancellable ? (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleCancel(current)}
                                        disabled={cancelMembership.isPending}
                                    >
                                        <Ban className="mr-2 h-4 w-4" />
                                        Cancelar
                                    </Button>
                                ) : (
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            {/* Wrapper: a disabled button swallows the events the tooltip needs. */}
                                            <span tabIndex={0}>
                                                <Button variant="outline" size="sm" disabled>
                                                    <Ban className="mr-2 h-4 w-4" />
                                                    Cancelar
                                                </Button>
                                            </span>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            Solo se puede cancelar una membresía vencida. Esta sigue vigente hasta el{' '}
                                            {formatDate(current.endDate)}.
                                        </TooltipContent>
                                    </Tooltip>
                                ))}
                            <Button variant="outline" size="sm" onClick={() => setRenewOpen(true)} disabled={!memberId}>
                                <RefreshCw className="mr-2 h-4 w-4" />
                                Renovar
                            </Button>
                        </div>
                    )}
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <Skeleton className="h-24 w-full" />
                    ) : isError ? (
                        <p className="text-sm text-destructive">
                            No se pudo cargar la membresía{error instanceof Error ? `: ${error.message}` : '.'}
                        </p>
                    ) : current ? (
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-foreground">{current.planName}</span>
                                <Badge variant="outline" className={membershipStatusColors[current.status]}>
                                    {membershipStatusLabels[current.status]}
                                </Badge>
                            </div>
                            <Separator />
                            <dl className="grid grid-cols-2 gap-3 text-sm">
                                <div>
                                    <dt className="text-muted-foreground">Inicio</dt>
                                    <dd className="text-foreground">{formatDate(current.startDate)}</dd>
                                </div>
                                <div>
                                    <dt className="text-muted-foreground">Vencimiento</dt>
                                    <dd className="text-foreground">{formatDate(current.endDate)}</dd>
                                </div>
                            </dl>
                            {history.length > 0 && (
                                <>
                                    <Separator />
                                    <div className="flex flex-col gap-1.5">
                                        <p className="text-xs font-medium text-muted-foreground">Historial</p>
                                        {history.map((m) => (
                                            <div key={m.id} className="flex items-center justify-between text-xs">
                                                <span className="text-muted-foreground">
                                                    {formatDate(m.startDate)} — {formatDate(m.endDate)}
                                                </span>
                                                <span className="text-muted-foreground">
                                                    {membershipStatusLabels[m.status]}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground">Sin membresia registrada.</p>
                    )}
                </CardContent>
            </Card>

            {memberId && (
                <RenewMembershipDialog
                    open={renewOpen}
                    onOpenChange={setRenewOpen}
                    memberId={memberId}
                    current={current}
                />
            )}
        </>
    );
}
