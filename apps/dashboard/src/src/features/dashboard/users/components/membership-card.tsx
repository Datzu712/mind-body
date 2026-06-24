import { useState } from 'react';
import { formatDate } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { IdCard, RefreshCw } from 'lucide-react';
import type { MemberProfile } from '../types';
import { RenewMembershipDialog } from './renew-membership-dialog';

const membershipStatusLabels: Record<string, string> = {
    ACTIVE: 'Activa',
    SUSPENDED: 'Suspendida',
    EXPIRED: 'Vencida',
};

const membershipStatusColors: Record<string, string> = {
    ACTIVE: 'border-success/30 bg-success/20 text-success',
    SUSPENDED: 'border-warning/30 bg-warning/20 text-warning',
    EXPIRED: 'border-destructive/30 bg-destructive/20 text-destructive',
};

/** Active-membership summary card with a renew action. */
export function MembershipCard({ membership }: { membership?: MemberProfile['activeMembership'] }) {
    const [renewOpen, setRenewOpen] = useState(false);

    return (
        <>
            <Card className="border-border bg-card">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-foreground">
                        <IdCard className="h-5 w-5" />
                        Membresia
                    </CardTitle>
                    <Button variant="outline" size="sm" onClick={() => setRenewOpen(true)}>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Renovar
                    </Button>
                </CardHeader>
                <CardContent>
                    {membership ? (
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-foreground">{membership.planName}</span>
                                <Badge variant="outline" className={membershipStatusColors[membership.status]}>
                                    {membershipStatusLabels[membership.status]}
                                </Badge>
                            </div>
                            <Separator />
                            <dl className="grid grid-cols-2 gap-3 text-sm">
                                <div>
                                    <dt className="text-muted-foreground">Inicio</dt>
                                    <dd className="text-foreground">{formatDate(membership.startDate)}</dd>
                                </div>
                                <div>
                                    <dt className="text-muted-foreground">Vencimiento</dt>
                                    <dd className="text-foreground">{formatDate(membership.endDate)}</dd>
                                </div>
                            </dl>
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground">Sin membresia activa.</p>
                    )}
                </CardContent>
            </Card>

            <RenewMembershipDialog open={renewOpen} onOpenChange={setRenewOpen} />
        </>
    );
}
