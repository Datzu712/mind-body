'use client';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Power, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import { type Membership, type MembershipStatus, membershipStatusLabels } from '@/src/shared/lib/mock-data';

// Un único tipo de plan fijo para todo el listado (visual mock)
const FIXED_MEMBERSHIP_TYPE = 'Premium';

interface MembershipsTableProps {
    memberships: Membership[];
    onDeactivate?: (membership: Membership) => void;
    onViewHistory?: (membership: Membership) => void;
}

// Badge local: etiquetas femeninas + tokens semánticos del dashboard (no usa StatusBadge compartido)
const statusClasses: Record<MembershipStatus, string> = {
    active: 'bg-success/20 text-success hover:bg-success/30 border-success/30',
    expired: 'bg-destructive/20 text-destructive hover:bg-destructive/30 border-destructive/30',
    'expiring-soon': 'bg-warning/20 text-warning hover:bg-warning/30 border-warning/30',
    inactive: 'bg-muted text-muted-foreground hover:bg-muted/80 border-muted-foreground/30',
};

function MembershipStatusBadge({ status }: { status: MembershipStatus }) {
    return (
        <Badge variant="outline" className={cn('font-medium border', statusClasses[status])}>
            {membershipStatusLabels[status]}
        </Badge>
    );
}

export function MembershipsTable({ memberships, onDeactivate, onViewHistory }: MembershipsTableProps) {
    return (
        <div className="rounded-lg border border-border overflow-hidden">
            <Table>
                <TableHeader>
                    <TableRow className="bg-muted/30 hover:bg-muted/30">
                        <TableHead className="text-muted-foreground font-semibold">ID miembro</TableHead>
                        <TableHead className="text-muted-foreground font-semibold">Nombre</TableHead>
                        <TableHead className="text-muted-foreground font-semibold">Tipo de membresía</TableHead>
                        <TableHead className="text-muted-foreground font-semibold">Estado</TableHead>
                        <TableHead className="text-muted-foreground font-semibold">Fecha de inicio</TableHead>
                        <TableHead className="text-muted-foreground font-semibold">Fecha de vencimiento</TableHead>
                        <TableHead className="text-muted-foreground font-semibold">Días restantes</TableHead>
                        <TableHead className="text-muted-foreground font-semibold text-right">Acciones</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {memberships.map((membership) => (
                        <TableRow key={membership.id} className="border-border">
                            <TableCell className="font-mono text-xs text-muted-foreground">
                                {membership.memberId}
                            </TableCell>
                            <TableCell className="font-medium text-foreground">{membership.memberName}</TableCell>
                            <TableCell className="text-foreground">{FIXED_MEMBERSHIP_TYPE}</TableCell>
                            <TableCell>
                                <MembershipStatusBadge status={membership.status} />
                            </TableCell>
                            <TableCell className="text-muted-foreground">{membership.startedAt}</TableCell>
                            <TableCell className="text-muted-foreground">{membership.expiresAt}</TableCell>
                            <TableCell className="text-foreground">{membership.remainingDays}</TableCell>
                            <TableCell>
                                <div className="flex items-center justify-end gap-1">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-destructive hover:text-destructive"
                                        title="Desactivar"
                                        onClick={() => onDeactivate?.(membership)}
                                    >
                                        <Power className="h-4 w-4" />
                                        <span className="sr-only">Desactivar</span>
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8"
                                        title="Ver historial"
                                        onClick={() => onViewHistory?.(membership)}
                                    >
                                        <Eye className="h-4 w-4" />
                                        <span className="sr-only">Ver historial</span>
                                    </Button>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
