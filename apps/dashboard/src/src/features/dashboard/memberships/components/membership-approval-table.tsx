'use client';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { StatusBadge } from '@/src/shared/components/status-badge';
import { Check, X, Eye } from 'lucide-react';
import { type MembershipApprovalRequest } from '@/src/shared/lib/mock-data';

interface MembershipApprovalTableProps {
    requests: MembershipApprovalRequest[];
    onApprove?: (request: MembershipApprovalRequest) => void;
    onReject?: (request: MembershipApprovalRequest) => void;
    onViewDetail?: (request: MembershipApprovalRequest) => void;
}

function getInitials(name: string) {
    return name
        .split(' ')
        .map((part) => part[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}

export function MembershipApprovalTable({ requests, onApprove, onReject, onViewDetail }: MembershipApprovalTableProps) {
    return (
        <div className="rounded-lg border border-border overflow-hidden">
            <Table>
                <TableHeader>
                    <TableRow className="bg-muted/30 hover:bg-muted/30">
                        <TableHead className="text-muted-foreground font-semibold">Miembro</TableHead>
                        <TableHead className="text-muted-foreground font-semibold">ID</TableHead>
                        <TableHead className="text-muted-foreground font-semibold">Plan solicitado</TableHead>
                        <TableHead className="text-muted-foreground font-semibold">Estado de pago</TableHead>
                        <TableHead className="text-muted-foreground font-semibold">Fecha de solicitud</TableHead>
                        <TableHead className="text-muted-foreground font-semibold text-right">Acciones</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {requests.map((request) => (
                        <TableRow key={request.id} className="border-border align-top">
                            {/* Miembro con avatar, correo y teléfono */}
                            <TableCell>
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-9 w-9">
                                        <AvatarFallback className="bg-primary/20 text-primary text-xs">
                                            {getInitials(request.memberName)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col">
                                        <span className="font-medium text-foreground">{request.memberName}</span>
                                        <span className="text-xs text-muted-foreground">{request.email}</span>
                                        <span className="text-xs text-muted-foreground">{request.phone}</span>
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell className="font-mono text-xs text-muted-foreground">
                                {request.memberId}
                            </TableCell>
                            {/* Plan + periodo (badge neutral) */}
                            <TableCell>
                                <div className="flex flex-col gap-1">
                                    <span className="text-foreground">{request.requestedPlan}</span>
                                    <Badge variant="secondary" className="w-fit text-xs">
                                        {request.period}
                                    </Badge>
                                </div>
                            </TableCell>
                            {/* Estado de pago: success (pagado) / warning (pendiente) + detalle */}
                            <TableCell>
                                <div className="flex flex-col gap-1">
                                    <StatusBadge status={request.paymentStatus} />
                                    <span className="text-xs text-muted-foreground">{request.paymentDetail}</span>
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className="flex flex-col">
                                    <span className="text-foreground">{request.requestedAt}</span>
                                    <span className="text-xs text-muted-foreground">{request.requestedTime}</span>
                                </div>
                            </TableCell>
                            {/* Acciones: Aprobar (success) / Rechazar (destructive) / Ver detalle (ghost) */}
                            <TableCell>
                                <div className="flex flex-wrap items-center justify-end gap-2">
                                    <Button
                                        type="button"
                                        size="sm"
                                        className="bg-success text-success-foreground hover:bg-success/90"
                                        onClick={() => onApprove?.(request)}
                                    >
                                        <Check className="mr-1 h-4 w-4" />
                                        Aprobar
                                    </Button>
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="destructive"
                                        onClick={() => onReject?.(request)}
                                    >
                                        <X className="mr-1 h-4 w-4" />
                                        Rechazar
                                    </Button>
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => onViewDetail?.(request)}
                                    >
                                        <Eye className="mr-1 h-4 w-4" />
                                        Ver detalle
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
