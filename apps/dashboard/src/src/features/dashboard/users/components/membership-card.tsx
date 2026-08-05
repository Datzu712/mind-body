import { useState } from 'react';
import { formatDate } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { ConfirmDialog } from '@/src/shared/components/confirm-dialog';
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
    const [cancelTarget, setCancelTarget] = useState<Membership | null>(null);
    const { data, isLoading, isError, error } = useMemberships(memberId);
    const cancelMembership = useCancelMembership(memberId ?? '');

    // The API returns the history newest-first by start date, which is NOT the
    // same as "the term running today": renewals are chained to start the day
    // after the current one ends, so the head can be a term that has not begun.
    const memberships = data ?? [];
    const today = new Date().toLocaleDateString('en-CA'); // 'YYYY-MM-DD', local
    const current =
        memberships.find((m) => m.startDate <= today && m.endDate >= today && m.status !== 'CANCELLED') ??
        memberships[0];
    const history = memberships.filter((m) => m.id !== current?.id);

    // A lapsed term is routine. A running one revokes access the member already
    // paid for at the front desk, so it travels as ADMIN_OVERRIDE and the dialog
    // says exactly that.
    const override = cancelTarget ? !cancelTarget.cancellable : false;

    const confirmCancel = () => {
        if (!cancelTarget) return;

        void cancelMembership
            .mutateAsync({ membershipId: cancelTarget.id, override })
            .then(() => sileo.success({ title: 'Membresía cancelada' }))
            .catch((e: unknown) =>
                sileo.error({
                    title: 'No se pudo cancelar',
                    description: e instanceof Error ? e.message : undefined,
                }),
            )
            .finally(() => setCancelTarget(null));
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
                            {/* Management can always cancel; `cancellable` only decides how
                                loudly the confirmation warns before it goes through. */}
                            {current && current.status !== 'CANCELLED' && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCancelTarget(current)}
                                    disabled={cancelMembership.isPending}
                                >
                                    <Ban className="mr-2 h-4 w-4" />
                                    Cancelar
                                </Button>
                            )}
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

            <ConfirmDialog
                open={cancelTarget !== null}
                onOpenChange={(open) => !open && setCancelTarget(null)}
                title={override ? '¿Cancelar una membresía vigente?' : '¿Cancelar la membresía?'}
                description={
                    override && cancelTarget
                        ? `Esta membresía sigue vigente hasta el ${formatDate(cancelTarget.endDate)}. Al cancelarla, el miembro pierde el acceso que ya pagó en recepción.`
                        : 'Se deja de dar seguimiento al miembro y no se le enviarán recordatorios de renovación.'
                }
                confirmLabel={override ? 'Cancelar de todos modos' : 'Confirmar'}
                cancelLabel="Volver"
                variant="destructive"
                onConfirm={confirmCancel}
            />
        </>
    );
}
